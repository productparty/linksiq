/**
 * Phase 2: Google Places API (New) Batch Fetch
 *
 * Fetches Place Details for all courses with a google_place_id,
 * stores structured data in courses table and reviews in course_reviews.
 *
 * Usage:
 *   npx tsx enrich-places-api.ts                 # Process all pending courses
 *   npx tsx enrich-places-api.ts --limit 5       # Dry-run: process 5 courses
 *   npx tsx enrich-places-api.ts --offset 100    # Resume from course 100
 */

import {
  supabase,
  GOOGLE_PLACES_API_KEY,
  RATE_LIMIT_MS,
  sleep,
  getArgInt,
} from "./enrich-config.js";

// ── Types ──────────────────────────────────────────────────

interface PlaceDetailsResponse {
  displayName?: { text: string; languageCode: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    periods: unknown[];
    weekdayDescriptions: string[];
  };
  priceLevel?: string;
  editorialSummary?: { text: string; languageCode: string };
  generativeSummary?: { text: string; languageCode: string };
  reviewSummary?: { text: string; languageCode: string };
  reviews?: GoogleReview[];
  googleMapsUri?: string;
  error?: { code: number; message: string; status: string };
}

interface GoogleReview {
  name: string; // "places/ABC/reviews/XYZ"
  rating: number;
  text?: { text: string; languageCode: string };
  originalText?: { text: string; languageCode: string };
  authorAttribution?: { displayName: string };
  publishTime?: string;
}

interface CourseRow {
  id: string;
  name: string;
  google_place_id: string;
  website_url: string | null;
  phone: string | null;
}

// ── Field mask ─────────────────────────────────────────────

const FIELD_MASK = [
  "displayName",
  "websiteUri",
  "nationalPhoneNumber",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "priceLevel",
  "editorialSummary",
  "generativeSummary",
  "reviewSummary",
  "reviews",
  "googleMapsUri",
].join(",");

// ── Fetch Place Details ────────────────────────────────────

async function fetchPlaceDetails(
  placeId: string
): Promise<PlaceDetailsResponse | null> {
  // Normalize: ensure placeId doesn't have "places/" prefix in the URL path
  const cleanId = placeId.replace(/^places\//, "");
  const url = `https://places.googleapis.com/v1/places/${cleanId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`  API error ${res.status}: ${body.slice(0, 200)}`);
    return null;
  }

  return (await res.json()) as PlaceDetailsResponse;
}

// ── Extract review ID from name ────────────────────────────

function extractReviewId(reviewName: string): string {
  // "places/ABC/reviews/XYZ" → "XYZ"
  const parts = reviewName.split("/");
  return parts[parts.length - 1];
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  const limit = getArgInt("--limit");
  const offset = getArgInt("--offset") ?? 0;

  console.log("=== LinksIQ Google Places Enrichment ===");
  console.log(`Limit: ${limit ?? "all"}, Offset: ${offset}`);
  console.log();

  // Fetch courses that need processing
  let query = supabase
    .from("courses")
    .select("id, name, google_place_id, website_url, phone")
    .not("google_place_id", "is", null)
    .or("enrichment_status.is.null,enrichment_status.eq.pending")
    .order("name", { ascending: true });

  if (limit) {
    query = query.range(offset, offset + limit - 1);
  } else if (offset > 0) {
    query = query.range(offset, offset + 9999);
  }

  const { data: courses, error: fetchError } = await query;

  if (fetchError) {
    console.error("Failed to fetch courses:", fetchError.message);
    process.exit(1);
  }

  if (!courses || courses.length === 0) {
    console.log("No courses to process. All done!");
    return;
  }

  console.log(`Found ${courses.length} courses to process.\n`);

  let success = 0;
  let noData = 0;
  let errors = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i] as CourseRow;
    const num = offset + i + 1;
    console.log(
      `[${num}/${offset + courses.length}] ${course.name}...`
    );

    try {
      const details = await fetchPlaceDetails(course.google_place_id);

      if (!details || details.error) {
        console.log(`  ⚠ No data returned`);
        noData++;
        // Still mark as processed so we don't retry
        await supabase
          .from("courses")
          .update({ enrichment_status: "api_fetched", enriched_at: new Date().toISOString() })
          .eq("id", course.id);
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Build course update object
      const courseUpdate: Record<string, unknown> = {
        google_rating: details.rating ?? null,
        google_rating_count: details.userRatingCount ?? null,
        editorial_summary: details.editorialSummary?.text ?? null,
        generative_summary: details.generativeSummary?.text ?? null,
        review_summary: details.reviewSummary?.text ?? null,
        opening_hours: details.regularOpeningHours ?? null,
        price_level: details.priceLevel ?? null,
        google_maps_uri: details.googleMapsUri ?? null,
        enrichment_status: "api_fetched",
        enriched_at: new Date().toISOString(),
      };

      // Only fill website_url and phone if currently empty
      if (!course.website_url && details.websiteUri) {
        courseUpdate.website_url = details.websiteUri;
      }
      if (!course.phone && details.nationalPhoneNumber) {
        courseUpdate.phone = details.nationalPhoneNumber;
      }

      // Update course
      const { error: updateError } = await supabase
        .from("courses")
        .update(courseUpdate)
        .eq("id", course.id);

      if (updateError) {
        console.error(`  ✗ Update failed: ${updateError.message}`);
        errors++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Insert reviews
      if (details.reviews && details.reviews.length > 0) {
        const reviewRows = details.reviews
          .filter((r) => r.name) // must have an ID
          .map((r) => ({
            course_id: course.id,
            author_name:
              r.authorAttribution?.displayName ?? null,
            rating: r.rating,
            text: r.text?.text ?? r.originalText?.text ?? null,
            publish_time: r.publishTime ?? null,
            language:
              r.text?.languageCode ??
              r.originalText?.languageCode ??
              null,
            google_review_id: extractReviewId(r.name),
          }));

        const { error: reviewError } = await supabase
          .from("course_reviews")
          .upsert(reviewRows, {
            onConflict: "course_id,google_review_id",
            ignoreDuplicates: true,
          });

        if (reviewError) {
          console.error(
            `  ⚠ Review insert failed: ${reviewError.message}`
          );
        } else {
          console.log(
            `  ✓ ${reviewRows.length} reviews, rating ${details.rating ?? "N/A"}`
          );
        }
      } else {
        console.log(
          `  ✓ No reviews, rating ${details.rating ?? "N/A"}`
        );
      }

      success++;
    } catch (err) {
      console.error(
        `  ✗ Error: ${err instanceof Error ? err.message : err}`
      );
      errors++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log("\n=== Summary ===");
  console.log(`Completed: ${success} success, ${noData} no data, ${errors} errors`);
  console.log(`Total API calls: ${success + noData + errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

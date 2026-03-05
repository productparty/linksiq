/**
 * Phase 3: LLM Review Extraction
 *
 * Reads Google reviews from course_reviews, sends them through Claude
 * to extract course-level and hole-level insights, then updates
 * courses and holes tables (only where values are currently NULL).
 *
 * Usage:
 *   npx tsx enrich-llm-extract.ts              # Process all api_fetched courses
 *   npx tsx enrich-llm-extract.ts --limit 5    # Dry-run: process 5 courses
 */

import Anthropic from "@anthropic-ai/sdk";
import { supabase, sleep, getArgInt } from "./enrich-config.js";

// ── Types ──────────────────────────────────────────────────

interface LLMExtraction {
  course_description: string | null;
  course_narrative: string | null;
  hole_insights: HoleInsight[];
  course_conditions: {
    common_praise: string[];
    common_complaints: string[];
    best_season: string | null;
    pace_of_play: string | null;
    difficulty_reputation: string | null;
  } | null;
}

interface HoleInsight {
  hole_number: number;
  strategic_tips: string | null;
  terrain_description: string | null;
  elevation_description: string | null;
  green_details: string | null;
  green_slope: string | null;
}

interface CourseRow {
  id: string;
  name: string;
  num_holes: number | null;
  total_par: number | null;
  description: string | null;
  walkthrough_narrative: string | null;
}

interface ReviewRow {
  text: string | null;
  rating: number | null;
  author_name: string | null;
}

// ── LLM Prompt ─────────────────────────────────────────────

function buildPrompt(
  courseName: string,
  numHoles: number | null,
  totalPar: number | null,
  reviews: ReviewRow[]
): string {
  const reviewsText = reviews
    .filter((r) => r.text)
    .map(
      (r, i) =>
        `Review ${i + 1} (${r.rating ?? "?"}★ by ${r.author_name ?? "Anonymous"}):\n${r.text}`
    )
    .join("\n\n");

  return `You are analyzing Google reviews for a golf course to extract useful intelligence for golfers.

Course: ${courseName}
Number of holes: ${numHoles ?? "unknown"}
Total par: ${totalPar ?? "unknown"}

Reviews:
${reviewsText}

Extract the following from these reviews. Only include information that is explicitly stated or strongly implied in the reviews. Do not fabricate details.

Return your response as JSON with this exact structure:

{
  "course_description": "A 2-3 sentence description of the course based on reviewer consensus. Include course character, notable features, and overall reputation. NULL if reviews don't provide enough info.",

  "course_narrative": "A brief walkthrough narrative of the course experience from arrival to finish, based on what reviewers describe. Include mentions of clubhouse, pace of play, conditions, standout moments. NULL if reviews are too thin.",

  "hole_insights": [
    {
      "hole_number": 7,
      "strategic_tips": "What reviewers say about how to play this hole — club selection, avoid the left bunker, etc.",
      "terrain_description": "What reviewers say about the hole's physical character — dogleg left, water on the right, elevated tee, etc.",
      "elevation_description": "Any mentions of uphill, downhill, elevated green, etc. NULL if not mentioned.",
      "green_details": "What reviewers say about the green — fast, sloped, multi-tiered, etc. NULL if not mentioned.",
      "green_slope": "Specific slope descriptions — back to front, left to right, etc. NULL if not mentioned."
    }
  ],

  "course_conditions": {
    "common_praise": ["List of things reviewers consistently praise"],
    "common_complaints": ["List of things reviewers consistently complain about"],
    "best_season": "If reviewers mention when the course plays best. NULL if not mentioned.",
    "pace_of_play": "What reviewers say about pace. NULL if not mentioned.",
    "difficulty_reputation": "How reviewers characterize difficulty. NULL if not mentioned."
  }
}

Rules:
- hole_insights array should ONLY contain holes that are specifically mentioned by number in reviews. Do not generate entries for unmentioned holes.
- If reviews don't mention any specific holes, return an empty hole_insights array.
- Be conservative — it's better to return NULL than to guess.
- course_conditions.common_praise and common_complaints should be short phrases, not full sentences.
- All text should be written as helpful advice to a golfer about to play the course.
- Return ONLY the JSON object, no markdown fences or extra text.`;
}

// ── Parse LLM response ────────────────────────────────────

function parseExtraction(raw: string): LLMExtraction | null {
  try {
    // Strip markdown fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(cleaned) as LLMExtraction;

    // Basic validation
    if (!Array.isArray(parsed.hole_insights)) {
      parsed.hole_insights = [];
    }

    return parsed;
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  const limit = getArgInt("--limit");

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Missing ANTHROPIC_API_KEY in .env. Set it before running LLM extraction."
    );
    process.exit(1);
  }

  const anthropic = new Anthropic();

  console.log("=== LinksIQ LLM Review Extraction ===");
  console.log(`Limit: ${limit ?? "all"}`);
  console.log();

  // Fetch courses that have been API-fetched but not LLM-processed
  let query = supabase
    .from("courses")
    .select(
      "id, name, num_holes, total_par, description, walkthrough_narrative"
    )
    .eq("enrichment_status", "api_fetched")
    .order("name", { ascending: true });

  if (limit) {
    query = query.limit(limit);
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

  let processed = 0;
  let skippedNoReviews = 0;
  let errors = 0;
  let fieldsUpdated = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i] as CourseRow;
    console.log(`[${i + 1}/${courses.length}] ${course.name}...`);

    // Fetch reviews for this course
    const { data: reviews, error: reviewError } = await supabase
      .from("course_reviews")
      .select("text, rating, author_name")
      .eq("course_id", course.id)
      .not("text", "is", null)
      .order("rating", { ascending: false });

    if (reviewError) {
      console.error(`  ✗ Failed to fetch reviews: ${reviewError.message}`);
      errors++;
      continue;
    }

    if (!reviews || reviews.length === 0) {
      console.log("  → No reviews, skipping LLM extraction");
      await supabase
        .from("courses")
        .update({ enrichment_status: "complete" })
        .eq("id", course.id);
      skippedNoReviews++;
      continue;
    }

    console.log(`  ${reviews.length} reviews found`);

    // Build prompt and call Claude
    const prompt = buildPrompt(
      course.name,
      course.num_holes,
      course.total_par,
      reviews as ReviewRow[]
    );

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("  ✗ No text in LLM response");
        errors++;
        continue;
      }

      const extraction = parseExtraction(textBlock.text);
      if (!extraction) {
        console.error("  ✗ Failed to parse LLM JSON response");
        console.error(`  Raw (first 300 chars): ${textBlock.text.slice(0, 300)}`);
        errors++;
        continue;
      }

      // ── Update courses table (only NULL fields) ──────────
      const courseUpdate: Record<string, unknown> = {
        enrichment_status: "complete",
      };

      if (!course.description && extraction.course_description) {
        courseUpdate.description = extraction.course_description;
        fieldsUpdated++;
      }
      if (
        !course.walkthrough_narrative &&
        extraction.course_narrative
      ) {
        courseUpdate.walkthrough_narrative = extraction.course_narrative;
        fieldsUpdated++;
      }
      if (extraction.course_conditions) {
        courseUpdate.course_conditions_json = extraction.course_conditions;
      }

      const { error: courseUpdateError } = await supabase
        .from("courses")
        .update(courseUpdate)
        .eq("id", course.id);

      if (courseUpdateError) {
        console.error(
          `  ✗ Course update failed: ${courseUpdateError.message}`
        );
        errors++;
        continue;
      }

      // ── Update holes table (only NULL fields) ────────────
      let holesUpdated = 0;

      if (extraction.hole_insights.length > 0) {
        // Validate hole numbers
        const maxHole = course.num_holes ?? 18;
        const validInsights = extraction.hole_insights.filter(
          (h) => h.hole_number >= 1 && h.hole_number <= maxHole
        );

        for (const insight of validInsights) {
          // Fetch current hole to check which fields are NULL
          const { data: holeData } = await supabase
            .from("holes")
            .select(
              "id, strategic_tips, terrain_description, elevation_description, green_details, green_slope"
            )
            .eq("course_id", course.id)
            .eq("hole_number", insight.hole_number)
            .single();

          if (!holeData) continue;

          const holeUpdate: Record<string, unknown> = {};
          let hasUpdate = false;

          if (!holeData.strategic_tips && insight.strategic_tips) {
            holeUpdate.strategic_tips = insight.strategic_tips;
            hasUpdate = true;
          }
          if (
            !holeData.terrain_description &&
            insight.terrain_description
          ) {
            holeUpdate.terrain_description = insight.terrain_description;
            hasUpdate = true;
          }
          if (
            !holeData.elevation_description &&
            insight.elevation_description
          ) {
            holeUpdate.elevation_description =
              insight.elevation_description;
            hasUpdate = true;
          }
          if (!holeData.green_details && insight.green_details) {
            holeUpdate.green_details = insight.green_details;
            hasUpdate = true;
          }
          if (!holeData.green_slope && insight.green_slope) {
            holeUpdate.green_slope = insight.green_slope;
            hasUpdate = true;
          }

          if (hasUpdate) {
            await supabase
              .from("holes")
              .update(holeUpdate)
              .eq("id", holeData.id);
            holesUpdated++;
            fieldsUpdated++;
          }
        }
      }

      const desc = extraction.course_description ? "desc" : "";
      const narr = extraction.course_narrative ? "narr" : "";
      const holes = holesUpdated > 0 ? `${holesUpdated} holes` : "";
      const parts = [desc, narr, holes].filter(Boolean).join(", ");
      console.log(
        `  ✓ Extracted: ${parts || "conditions only"}`
      );

      processed++;
    } catch (err) {
      console.error(
        `  ✗ LLM error: ${err instanceof Error ? err.message : err}`
      );
      errors++;
    }

    // Small delay between LLM calls
    await sleep(500);
  }

  console.log("\n=== Summary ===");
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (no reviews): ${skippedNoReviews}`);
  console.log(`Errors: ${errors}`);
  console.log(`Fields updated: ${fieldsUpdated}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

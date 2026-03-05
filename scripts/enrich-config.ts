import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ───────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Google Places ──────────────────────────────────────────
export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env");
  process.exit(1);
}

// ── Rate limiting ──────────────────────────────────────────
export const RATE_LIMIT_MS = 300; // ms between API calls

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── CLI arg helpers ────────────────────────────────────────
export function getArgInt(flag: string): number | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  const val = parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(val) ? val : undefined;
}

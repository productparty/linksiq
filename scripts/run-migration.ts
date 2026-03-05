/**
 * Run migration 006 via direct PostgreSQL connection using pg driver.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import pg from "pg";

const { Client } = pg;

async function main() {
  console.log("Running migration 006_google_enrichment...\n");

  const client = new Client({
    host: "aws-0-us-west-2.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.mxccczyunhvjuyfkvpym",
    password: "Watso3mj16!L",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database.\n");

    const sql = readFileSync(
      new URL(
        "../server/db/migrations/006_google_enrichment.sql",
        import.meta.url
      ),
      "utf-8"
    );

    await client.query(sql);
    console.log("Migration executed successfully!");

    // Verify
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'google_rating'"
    );
    console.log(
      `\nVerification: google_rating column exists = ${rows.length > 0}`
    );

    const { rows: tableRows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'course_reviews'"
    );
    console.log(
      `Verification: course_reviews table exists = ${tableRows.length > 0}`
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

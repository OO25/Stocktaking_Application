import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// Load .env from project root (three levels up from server/src/db/)
dotenv.config({ path: path.join(__dirname, "../../../.env") });

/**
 * Runs all pending SQL migration files in order.
 * Tracks completed migrations in a _migrations table to avoid re-running.
 */
async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Create tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    // Get list of already-applied migrations
    const { rows: applied } = await pool.query(
      "SELECT filename FROM _migrations ORDER BY filename"
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Read migration files and filter out already-applied ones
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    // Run each pending migration in order
    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`Running: ${file}`);
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
      console.log(`  ✓ Applied`);
    }

    console.log(`\nDone — ${pending.length} migration(s) applied.`);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

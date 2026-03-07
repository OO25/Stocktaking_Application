import pg from "pg";

const { Pool } = pg;

/**
 * Strips connection string parameters that node-postgres doesn't support
 * (e.g. channel_binding which is a libpq-only option and causes silent failures).
 */
function sanitizeConnectionString(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

const pool = new Pool({
  connectionString: sanitizeConnectionString(process.env.DATABASE_URL),
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export default pool;

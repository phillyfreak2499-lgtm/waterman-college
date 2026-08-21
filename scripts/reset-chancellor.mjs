#!/usr/bin/env node
/**
 * Delete the Chancellor account so it can be re-provisioned with a known
 * password. Run this against the live database (it reads DATABASE_URL), then
 * re-run provisioning (`curl -X POST … /api/setup/chancellor`).
 *
 *   node scripts/reset-chancellor.mjs            # uses CHANCELLOR_USERNAME
 *   node scripts/reset-chancellor.mjs someuser   # or an explicit username
 *
 * Sessions and the login credential are removed automatically via
 * `on delete cascade`; this also clears the user_profiles row so the
 * single-super-admin index is freed for a fresh provision.
 */
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — run this in an environment that has it (e.g. the Render shell).");
  process.exit(1);
}

const rawUser = (process.argv[2] || process.env.CHANCELLOR_USERNAME || "").trim().toLowerCase();
if (!rawUser) {
  console.error("No username. Pass one: node scripts/reset-chancellor.mjs <username>");
  process.exit(1);
}
const email = `${rawUser}@accounts.waterman`;

const pool = new pg.Pool({ connectionString: url });
try {
  const found = await pool.query('select id from "user" where lower(email) = $1', [email]);
  if (found.rows.length === 0) {
    console.log(`No account found for ${email} — nothing to delete.`);
  } else {
    const id = found.rows[0].id;
    await pool.query("delete from user_profiles where user_id = $1", [id]);
    await pool.query('delete from "user" where id = $1', [id]);
    console.log(`RESET OK — deleted ${email} (${id}). Now re-run provisioning to recreate it.`);
  }
} catch (err) {
  console.error("Reset failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await pool.end();
}

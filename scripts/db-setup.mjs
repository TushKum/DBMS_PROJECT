#!/usr/bin/env node
// Runs the SQL files in db/ against DATABASE_URL.
// Usage:
//   node scripts/db-setup.mjs           — runs schema, triggers, procedures, seed
//   node scripts/db-setup.mjs --seed-only

import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const DB_DIR = path.resolve(SCRIPT_DIR, "..", "db");

const ALL_FILES = [
  "01_schema.sql",
  "02_triggers.sql",
  "03_procedures.sql",
  "04_seed.sql",
];

const seedOnly = process.argv.includes("--seed-only");
const files = seedOnly ? ["04_seed.sql"] : ALL_FILES;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Pull from Vercel: `vercel env pull .env.local`");
  process.exit(1);
}

const conn = await mysql.createConnection({
  uri: url,
  multipleStatements: true,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: true, minVersion: "TLSv1.2" }
      : undefined,
});

try {
  for (const f of files) {
    const sql = await fs.readFile(path.join(DB_DIR, f), "utf8");
    process.stdout.write(`→ ${f} ... `);
    // mysql2 supports DELIMITER-style stored-routine bodies via multipleStatements
    // when the connection sends them as one batch; for safety, strip DELIMITER //
    // markers and split on // when present.
    const stripped = sql.includes("DELIMITER //")
      ? sql.replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, (block) => {
          const inner = block
            .replace(/^DELIMITER \/\//m, "")
            .replace(/DELIMITER ;\s*$/m, "");
          return inner.replace(/\/\//g, ";");
        })
      : sql;
    await conn.query(stripped);
    process.stdout.write("ok\n");
  }
  console.log("\nDone.");
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exit(1);
} finally {
  await conn.end();
}

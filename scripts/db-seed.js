/**
 * DB SEED UPLOADER
 * ----------------------------------------------------------------------------
 * Executes a SQL seed file against the remote Supabase project using the
 * Supabase Management API. Requires a personal access token (NOT the service
 * role key) stored in the environment.
 *
 * USAGE:
 *   npm run db:seed                          # uploads supabase/seed_library.sql
 *   npm run db:seed -- --file path/to/other.sql
 *
 * REQUIRED ENV VARS (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL  - e.g. https://ucvaxxitwnoszvvwskpz.supabase.co
 *   SUPABASE_ACCESS_TOKEN     - personal access token from supabase.com/dashboard/account/tokens
 *
 * The Management API splits large SQL into batches of individual statements
 * to stay within API body size limits.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency needed)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}
if (!ACCESS_TOKEN) {
  console.error('❌  SUPABASE_ACCESS_TOKEN is not set in .env.local');
  console.error('    Get one at: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// Resolve the SQL file path (default or --file override)
const fileArgIdx = process.argv.indexOf('--file');
const SQL_FILE = fileArgIdx !== -1
  ? path.resolve(process.argv[fileArgIdx + 1])
  : path.join(__dirname, '..', 'supabase', 'seed_library.sql');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split SQL into individual statements on semicolons, preserving escaped
 * single-quotes inside jsonb literals. We batch them to avoid hitting the
 * API body size limit (~1 MB per request).
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "'" && !inString) {
      inString = true;
      current += ch;
    } else if (ch === "'" && inString) {
      if (next === "'") {
        // Escaped quote inside string — consume both
        current += "''";
        i++;
      } else {
        inString = false;
        current += ch;
      }
    } else if (ch === ';' && !inString) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt + ';');
      current = '';
    } else {
      current += ch;
    }
  }
  const remaining = current.trim();
  if (remaining) statements.push(remaining);
  return statements;
}

async function runQuery(sql) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`📂  Reading: ${SQL_FILE}`);
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌  File not found: ${SQL_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const statements = splitStatements(sql).filter(s => {
    // Skip comment-only lines and blank statements
    const stripped = s.replace(/--[^\n]*/g, '').trim();
    return stripped.length > 1; // more than just ";"
  });

  console.log(`🗄️   Project:    ${PROJECT_REF}`);
  console.log(`📝  Statements: ${statements.length}`);

  // Batch statements to stay under ~900 KB per request
  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    batches.push(statements.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦  Batches:    ${batches.length} (${BATCH_SIZE} statements each)\n`);

  let completed = 0;
  for (let i = 0; i < batches.length; i++) {
    const batchSql = batches[i].join('\n');
    process.stdout.write(`  Batch ${String(i + 1).padStart(3)} / ${batches.length} ... `);
    try {
      await runQuery(batchSql);
      completed += batches[i].length;
      process.stdout.write(`✅\n`);
    } catch (err) {
      process.stdout.write(`❌\n`);
      console.error(`\n  Error in batch ${i + 1}:\n  ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\n✅  Done — ${completed} statements executed successfully.`);
}

main();

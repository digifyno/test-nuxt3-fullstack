#!/usr/bin/env node
// Database initialization script
// Loads .env file, sets a default DATABASE_URL if not configured, then runs Prisma migrations and seeding
import { execSync, execFileSync } from 'child_process'
import { resolve } from 'path'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'

// Load .env file so build-time migrations target the same database as runtime
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/)
    if (match) {
      const [, key, val] = match
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, '')
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  // Use an absolute path so both prisma migrate deploy and the production Prisma client
  // resolve to the same file. Relative paths get resolved differently by the Prisma CLI
  // (relative to schema.prisma dir) vs the bundled runtime client (relative to config.dirname).
  process.env.DATABASE_URL = 'file:' + resolve(process.cwd(), 'prisma', 'prod.db')
  console.log('DATABASE_URL not set, using default:', process.env.DATABASE_URL)
}

// Apply migrations. If the SQLite database already exists with tables but no
// _prisma_migrations tracking table (P3005 — "The database schema is not empty"),
// baseline each known migration as already-applied and retry. This keeps deploys
// idempotent across pre-existing databases created before migrations were adopted.
function runMigrateDeploy() {
  // Use stdio: 'pipe' so err.stdout / err.stderr are populated on failure;
  // we echo the captured output so logs look the same as 'inherit'.
  const out = execSync('npx prisma migrate deploy', { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
  if (out?.length) process.stdout.write(out)
}

function baselineExistingSchema() {
  const migrationsDir = resolve(process.cwd(), 'prisma', 'migrations')
  if (!existsSync(migrationsDir)) return false
  const entries = readdirSync(migrationsDir)
    .filter((name) => statSync(resolve(migrationsDir, name)).isDirectory())
    .sort() // lexicographic = chronological for timestamped migration names
  if (entries.length === 0) return false
  console.log(`Baselining ${entries.length} existing migration(s) as already applied…`)
  for (const migration of entries) {
    // execFileSync with arg array avoids any shell interpretation of migration names
    execFileSync('npx', ['prisma', 'migrate', 'resolve', '--applied', migration], {
      stdio: 'inherit',
      env: process.env,
    })
  }
  return true
}

try {
  try {
    runMigrateDeploy()
  } catch (err) {
    // Prisma surfaces error codes in stdout/stderr (not the thrown error's code prop).
    // Dump captured output to the console first so deploy logs remain useful.
    if (err?.stdout?.length) process.stdout.write(err.stdout)
    if (err?.stderr?.length) process.stderr.write(err.stderr)
    const combined = `${err?.message || ''}\n${err?.stdout?.toString?.() || ''}\n${err?.stderr?.toString?.() || ''}`
    if (combined.includes('P3005') && baselineExistingSchema()) {
      console.log('Baseline complete — retrying migrate deploy')
      runMigrateDeploy()
    } else {
      throw err
    }
  }
  console.log('Database migrations applied successfully')
} catch (err) {
  console.error('Failed to apply database migrations:', err.message)
  process.exit(1)
}

// Seed demo data (idempotent via upsert - safe to run on every deploy)
try {
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    env: process.env,
  })
  console.log('Database seeded successfully')
} catch (err) {
  console.error('Failed to seed database:', err.message)
  process.exit(1)
}

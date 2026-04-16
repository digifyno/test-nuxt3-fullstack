#!/usr/bin/env node
// Database initialization script
// Loads .env file, sets a default DATABASE_URL if not configured, then runs Prisma migrations and seeding
import { execSync } from 'child_process'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

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

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  })
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

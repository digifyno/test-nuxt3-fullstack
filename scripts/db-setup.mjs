#!/usr/bin/env node
// Database initialization script
// Sets a default DATABASE_URL if not configured, then runs Prisma migrations and seeding
import { execSync } from 'child_process'
import { resolve } from 'path'

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

#!/usr/bin/env node
// Database initialization script
// Sets a default DATABASE_URL if not configured, then runs Prisma migrations
import { execSync } from 'child_process'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/prod.db'
  console.log('DATABASE_URL not set, using default: file:./prisma/prod.db')
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

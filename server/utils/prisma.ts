import { PrismaClient } from '@prisma/client'
import { resolve } from 'path'

// Provide a default DATABASE_URL for environments where it's not configured.
// Use an absolute path derived from process.cwd() (the project root in both dev and production)
// so it works correctly in bundled production builds where relative paths in the
// Prisma client binary are resolved relative to the generated client directory.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:' + resolve(process.cwd(), 'prisma', 'prod.db')
}

let prisma: PrismaClient

declare global {
   
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient()
  }
  prisma = globalThis.__prisma
}

export default prisma

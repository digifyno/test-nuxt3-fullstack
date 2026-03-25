import { PrismaClient } from '@prisma/client'

// Provide a default DATABASE_URL for environments where it's not configured
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/prod.db'
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

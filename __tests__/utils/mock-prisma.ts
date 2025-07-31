import { mockDeep, mockReset } from 'vitest-mock-extended'
import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prismaMock = mockDeep<PrismaClient>()

vi.mock('@/lib/db', () => ({
  __esModule: true,
  prisma: prismaMock,
  db: prismaMock,
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prisma = prismaMock
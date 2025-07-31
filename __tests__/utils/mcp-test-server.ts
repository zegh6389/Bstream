import { createServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { redis } from './mock-redis'
import { mockPrisma } from './mock-prisma'
import { PrismaClient } from '@prisma/client'

export class MCPTestServer {
  private prisma: PrismaClient

  constructor() {
    // Use mock Prisma client
    this.prisma = mockPrisma
  }

  async start() {
    // Initialize test database
    await this.prisma.$connect()
    
    // Clear rate limit data
    await redis.flushall()
  }

  async close() {
    await this.prisma.$disconnect()
  }

  async inject(request: {
    method: string
    url: string
    payload?: any
    headers?: Record<string, string>
  }): Promise<{
    statusCode: number
    payload: string
    headers: Record<string, string>
  }> {
    return new Promise((resolve, reject) => {
      const fullUrl = `http://localhost:3000${request.url}`
      const ip = request.headers?.['x-forwarded-for'] || '127.0.0.1'

      const req = new Request(fullUrl, {
        method: request.method,
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': ip,
          ...request.headers,
        },
        body: request.payload ? JSON.stringify(request.payload) : undefined,
      })

      const routePath = `${process.cwd()}/src/app${request.url}/route.ts`

      import(routePath)
        .then(async (module) => {
          const response: Response = await module.POST(req)
          
          const responseHeaders: Record<string, string> = {}
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value
          })

          const body = await response.text()

          resolve({
            statusCode: response.status,
            payload: body,
            headers: responseHeaders,
          })
        })
        .catch((error) => {
          console.error('Route error:', error)
          resolve({
            statusCode: 500,
            payload: JSON.stringify({ error: error.message }),
            headers: {},
          })
        })
    })
  }

  async cleanup() {
    // Clean up test data
    await this.prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    })
  }
}

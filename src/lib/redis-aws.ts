import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL
const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
const REDIS_PASSWORD = process.env.REDIS_PASSWORD
const REDIS_TLS = process.env.REDIS_TLS === 'true'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined
}

/**
 * Get Redis instance with AWS ElastiCache support
 */
function createRedisClient(): Redis {
  try {
    if (REDIS_URL) {
      // Use Redis URL (for local development or simple setup)
      return new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        ...(REDIS_TLS && { tls: {} }),
      })
    } else if (REDIS_HOST) {
      // Use individual config (for AWS ElastiCache)
      const config: any = {
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        family: 4,
        keepAlive: true,
        connectTimeout: 10000,
      }
      
      if (REDIS_PASSWORD) {
        config.password = REDIS_PASSWORD
      }
      
      if (REDIS_TLS) {
        config.tls = {}
      }
      
      return new Redis(config)
    } else {
      // Fallback to localhost for development
      return new Redis('redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })
    }
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    throw error
  }
}

export const redis = global.redis || createRedisClient()

// Setup event handlers
redis.on('error', (error) => {
  console.error('Redis connection error:', error)
})

redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('ready', () => {
  console.log('✅ Redis ready for commands')
})

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed')
})

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<{
  success: boolean
  error?: string
  latency?: number
}> {
  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start
    
    return { success: true, latency }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

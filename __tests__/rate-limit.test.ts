import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redis } from './utils/mock-redis'
import { authLimiter, checkRateLimit } from '../src/lib/rate-limit'

vi.mock('./utils/mock-redis')

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow requests within limit', async () => {
    const result = await checkRateLimit(authLimiter, 'test-key')
    
    expect(result.success).toBe(true)
    expect(result.remaining).toBeDefined()
    expect(result.limit).toBe(5)
  })

  it('should block when limit exceeded', async () => {
    // Consume all points
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(authLimiter, 'test-key')
    }

    const result = await checkRateLimit(authLimiter, 'test-key')
    
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeDefined()
  })
})

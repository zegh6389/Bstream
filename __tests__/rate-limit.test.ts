import { describe, it, expect, beforeEach } from 'vitest'
import { authLimiter, checkRateLimit } from '../src/lib/rate-limit.new'

describe('Rate Limiter', () => {
  it('should allow requests within limit', async () => {
    const result = await checkRateLimit(authLimiter, 'test-key-allow')
    
    expect(result.success).toBe(true)
    expect(result.remaining).toBeDefined()
    expect(result.limit).toBe(3) // authLimiter has 3 points
  })

  it('should block when limit exceeded', async () => {
    const key = 'test-key-block'
    
    // Consume all points
    for (let i = 0; i < 6; i++) {
      await checkRateLimit(authLimiter, key)
    }

    const result = await checkRateLimit(authLimiter, key)
    
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeDefined()
  })
})

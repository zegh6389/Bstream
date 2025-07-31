import { RateLimiterRedis, RateLimiterMemory, IRateLimiterOptions } from "rate-limiter-flexible";
import { redis } from './redis';

interface RateLimitError extends Error {
  msBeforeNext: number;
}

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  retryAfter?: number;
}

function createLimiter(options: IRateLimiterOptions) {
  const isTest = process.env.NODE_ENV === 'test';
  
  return isTest 
    ? new RateLimiterMemory(options)
    : new RateLimiterRedis({ storeClient: redis, ...options });
}

export const authLimiter = createLimiter({
  keyPrefix: "rl_auth",
  points: 3,
  duration: 60 * 15,
  blockDuration: 60 * 15
})

export const emailLimiter = createLimiter({
  keyPrefix: "rl_email",
  points: 2,
  duration: 60 * 60,
  blockDuration: 60 * 60
})

export const resetLimiter = createLimiter({
  keyPrefix: "rl_reset",
  points: 2,
  duration: 60 * 60,
  blockDuration: 60 * 60
})

export const twoFactorLimiter = createLimiter({
  keyPrefix: "rl_2fa",
  points: 3,
  duration: 60 * 15,
  blockDuration: 60 * 15
})

export async function checkRateLimit(limiter: RateLimiterRedis | RateLimiterMemory, key: string): Promise<RateLimitResult> {
  try {
    await limiter.consume(key)
    return {
      success: true,
      limit: limiter.points,
      remaining: limiter.points - 1
    }
  } catch (error) {
    const rateLimitError = error as RateLimitError
    return {
      success: false,
      retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000)
    }
  }
}

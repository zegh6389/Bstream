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
  const isBuild = process.env.NODE_ENV === undefined;
  
  // During build time, use memory limiter to avoid Redis connection issues
  if (isTest || isBuild) {
    return new RateLimiterMemory(options);
  }
  
  try {
    return new RateLimiterRedis({ storeClient: redis, ...options });
  } catch (error) {
    console.warn('Failed to create Redis rate limiter, falling back to memory:', error);
    return new RateLimiterMemory(options);
  }
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

// General purpose rate limiter for API endpoints
export const rateLimiter = createLimiter({
  keyPrefix: "rl_api",
  points: 10,
  duration: 60,
  blockDuration: 60
})

export async function checkRateLimit(limiter: RateLimiterRedis | RateLimiterMemory, key: string): Promise<RateLimitResult> {
  try {
    const result = await limiter.consume(key)
    return {
      success: true,
      limit: limiter.points,
      remaining: result.remainingPoints
    }
  } catch (error) {
    const rateLimitError = error as RateLimitError
    return {
      success: false,
      limit: limiter.points,
      remaining: 0,
      retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000)
    }
  }
}

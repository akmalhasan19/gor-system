import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed Rate Limiter using Upstash Redis.
 * 
 * This replaces the in-memory rate limiter which did not work correctly
 * in serverless environments (Vercel) where each invocation may be a new instance.
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Create Redis client from environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter for general API routes (20 requests per 60 seconds)
export const apiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: true,
    prefix: "smash:api",
});

// Rate limiter for external API v1 routes (60 requests per 60 seconds)
export const externalApiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    analytics: true,
    prefix: "smash:v1",
});

// Fallback in-memory limiter for when Redis is not configured
// This is a safety net for development environments without Upstash
export class FallbackRateLimiter {
    private tokenCache: Map<string, { count: number; lastReset: number }>;
    private interval: number;

    constructor(intervalMs: number = 60000) {
        this.tokenCache = new Map();
        this.interval = intervalMs;
    }

    public async check(limit: number, token: string) {
        const now = Date.now();
        const context = this.tokenCache.get(token) || { count: 0, lastReset: now };

        if (now - context.lastReset > this.interval) {
            context.count = 0;
            context.lastReset = now;
        }

        const success = context.count < limit;
        if (success) context.count++;

        this.tokenCache.set(token, context);

        return {
            success,
            limit,
            remaining: Math.max(0, limit - context.count),
            reset: context.lastReset + this.interval,
        };
    }
}

// Check if Upstash is configured
export const isUpstashConfigured = () => {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
};

// Export the fallback for use when Upstash is not configured
export const fallbackLimiter = new FallbackRateLimiter();

export interface RateLimitConfig {
    interval: number; // Interval in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique users per interval
}

interface RateLimitContext {
    count: number;
    lastReset: number;
}

export class RateLimiter {
    private tokenCache: Map<string, RateLimitContext>;
    private interval: number;

    constructor(config: RateLimitConfig) {
        this.tokenCache = new Map();
        this.interval = config.interval;
    }

    /**
     * Check if a token (IP) has exceeded the limit.
     * @param limit Max requests per interval
     * @param token Unique identifier (e.g. IP address)
     * @returns Promise<{ success: boolean; limit: number; remaining: number; reset: number }>
     */
    public async check(limit: number, token: string) {
        const now = Date.now();
        const context = this.tokenCache.get(token) || { count: 0, lastReset: now };

        // Reset if interval passed
        if (now - context.lastReset > this.interval) {
            context.count = 0;
            context.lastReset = now;
        }

        const success = context.count < limit;
        if (success) {
            context.count++;
        }

        this.tokenCache.set(token, context);

        // Optional: Clean up old entries periodically to prevent memory leaks in long-running process
        // For serverless/edge this is less critical as memory resets often.
        // For now, naive LRU-like behavior is assumed by runtime restarts.

        return {
            success,
            limit,
            remaining: Math.max(0, limit - context.count),
            reset: context.lastReset + this.interval,
        };
    }
}

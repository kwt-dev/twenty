import { Injectable, Inject } from '@nestjs/common';
import { RateLimitKeyGeneratorService } from '../utils/rate-limiting/rate-limit-key-generator';
import {
  RateLimitCalculatorService,
  RateLimitConfig,
} from '../utils/rate-limiting/rate-limit-calculator';

// Interface for Redis client service that can be injected
export interface IRedisClientService {
  getClient(): {
    get(key: string): Promise<string | null>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    del(...keys: string[]): Promise<number>;
    pipeline(): {
      incr(key: string): any;
      expire(key: string, seconds: number): any;
      exec(): Promise<any>;
    };
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: Date;
  limitType?: 'minute' | 'hour' | 'day';
  current?: number;
  limit?: number;
}

export interface RateLimitCheckOptions {
  workspaceId: string;
  messageType?: 'SMS' | 'MMS';
  urgency?: 'normal' | 'high';
}

/**
 * Service for rate limiting SMS/MMS messages using Redis.
 * Implements sliding window rate limiting with multiple time windows.
 */
@Injectable()
export class SmsRateLimiterService {
  constructor(
    @Inject('IRedisClientService')
    private readonly redisClientService: IRedisClientService,
    private readonly rateLimitCalculator: RateLimitCalculatorService,
    private readonly keyGenerator: RateLimitKeyGeneratorService,
  ) {}

  /**
   * Check rate limits and increment counters if allowed.
   * @param options - Rate limit check options
   * @returns Rate limit result
   */
  async checkAndIncrement(
    options: RateLimitCheckOptions,
  ): Promise<RateLimitResult> {
    const { workspaceId, messageType = 'SMS', urgency = 'normal' } = options;

    try {
      const limits = this.rateLimitCalculator.getLimits(
        workspaceId,
        messageType,
      );
      const redis = this.redisClientService.getClient();

      // Check all time windows for violations
      const timeWindows: Array<'minute' | 'hour' | 'day'> = [
        'minute',
        'hour',
        'day',
      ];

      for (const window of timeWindows) {
        const key = this.keyGenerator.generateTimeWindowKey(
          workspaceId,
          messageType,
          window,
        );
        const currentStr = await redis.get(key);
        const current = currentStr ? parseInt(currentStr, 10) : 0;
        const limit = limits[window];

        if (this.rateLimitCalculator.isLimitExceeded(current, limit)) {
          return {
            allowed: false,
            limitType: window,
            current,
            limit,
            resetTime: this.rateLimitCalculator.calculateResetTime(window),
            remaining: this.rateLimitCalculator.calculateRemaining(
              current,
              limit,
            ),
          };
        }
      }

      // All checks passed - increment counters atomically
      const pipeline = redis.pipeline();
      const ttls: Record<string, number> = {};

      for (const window of timeWindows) {
        const key = this.keyGenerator.generateTimeWindowKey(
          workspaceId,
          messageType,
          window,
        );
        const ttl = this.rateLimitCalculator.calculateTTL(window);

        pipeline.incr(key);
        pipeline.expire(key, ttl);
        ttls[window] = ttl;
      }

      await pipeline.exec();

      // Calculate remaining quota for the most restrictive window
      const mostRestrictive =
        this.rateLimitCalculator.getMostRestrictiveLimit(limits);
      const remaining = this.rateLimitCalculator.calculateRemaining(
        1,
        mostRestrictive.limit,
      );

      return {
        allowed: true,
        remaining,
        resetTime: this.rateLimitCalculator.calculateResetTime(
          mostRestrictive.window,
        ),
      };
    } catch (error) {
      // Graceful degradation - allow requests if Redis is unavailable
      console.warn(
        'Redis unavailable, allowing request with rate limit warning:',
        error,
      );
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000), // Reset in 1 minute
      };
    }
  }

  /**
   * Check rate limits without incrementing counters.
   * @param options - Rate limit check options
   * @returns Rate limit status
   */
  async checkOnly(options: RateLimitCheckOptions): Promise<RateLimitResult> {
    const { workspaceId, messageType = 'SMS' } = options;

    try {
      const limits = this.rateLimitCalculator.getLimits(
        workspaceId,
        messageType,
      );
      const redis = this.redisClientService.getClient();

      const timeWindows: Array<'minute' | 'hour' | 'day'> = [
        'minute',
        'hour',
        'day',
      ];

      for (const window of timeWindows) {
        const key = this.keyGenerator.generateTimeWindowKey(
          workspaceId,
          messageType,
          window,
        );
        const currentStr = await redis.get(key);
        const current = currentStr ? parseInt(currentStr, 10) : 0;
        const limit = limits[window];

        if (this.rateLimitCalculator.isLimitExceeded(current, limit)) {
          return {
            allowed: false,
            limitType: window,
            current,
            limit,
            resetTime: this.rateLimitCalculator.calculateResetTime(window),
            remaining: this.rateLimitCalculator.calculateRemaining(
              current,
              limit,
            ),
          };
        }
      }

      // Calculate remaining quota for the most restrictive window
      const mostRestrictive =
        this.rateLimitCalculator.getMostRestrictiveLimit(limits);
      const remaining = this.rateLimitCalculator.calculateRemaining(
        0,
        mostRestrictive.limit,
      );

      return {
        allowed: true,
        remaining,
        resetTime: this.rateLimitCalculator.calculateResetTime(
          mostRestrictive.window,
        ),
      };
    } catch (error) {
      // Graceful degradation - allow requests if Redis is unavailable
      console.warn('Redis unavailable for rate limit check:', error);
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000),
      };
    }
  }

  /**
   * Get current usage statistics for a workspace.
   * @param workspaceId - Workspace identifier
   * @param messageType - Type of message
   * @returns Current usage across all time windows
   */
  async getCurrentUsage(
    workspaceId: string,
    messageType: 'SMS' | 'MMS' = 'SMS',
  ): Promise<{
    minute: { current: number; limit: number; remaining: number };
    hour: { current: number; limit: number; remaining: number };
    day: { current: number; limit: number; remaining: number };
  }> {
    try {
      const limits = this.rateLimitCalculator.getLimits(
        workspaceId,
        messageType,
      );
      const redis = this.redisClientService.getClient();

      const timeWindows: Array<'minute' | 'hour' | 'day'> = [
        'minute',
        'hour',
        'day',
      ];
      const usage: Record<
        string,
        { current: number; limit: number; remaining: number }
      > = {};

      for (const window of timeWindows) {
        const key = this.keyGenerator.generateTimeWindowKey(
          workspaceId,
          messageType,
          window,
        );
        const currentStr = await redis.get(key);
        const current = currentStr ? parseInt(currentStr, 10) : 0;
        const limit = limits[window];

        usage[window] = {
          current,
          limit,
          remaining: this.rateLimitCalculator.calculateRemaining(
            current,
            limit,
          ),
        };
      }

      return usage as {
        minute: { current: number; limit: number; remaining: number };
        hour: { current: number; limit: number; remaining: number };
        day: { current: number; limit: number; remaining: number };
      };
    } catch (error) {
      console.warn('Redis unavailable for usage statistics:', error);
      const limits = this.rateLimitCalculator.getLimits(
        workspaceId,
        messageType,
      );

      return {
        minute: { current: 0, limit: limits.minute, remaining: limits.minute },
        hour: { current: 0, limit: limits.hour, remaining: limits.hour },
        day: { current: 0, limit: limits.day, remaining: limits.day },
      };
    }
  }

  /**
   * Reset rate limit counters for a workspace (admin function).
   * @param workspaceId - Workspace identifier
   * @param messageType - Type of message
   * @param timeWindow - Specific time window to reset (optional)
   */
  async resetLimits(
    workspaceId: string,
    messageType: 'SMS' | 'MMS' = 'SMS',
    timeWindow?: 'minute' | 'hour' | 'day',
  ): Promise<void> {
    try {
      const redis = this.redisClientService.getClient();

      if (timeWindow) {
        const key = this.keyGenerator.generateTimeWindowKey(
          workspaceId,
          messageType,
          timeWindow,
        );
        await redis.del(key);
      } else {
        const keys = this.keyGenerator.generateKeys(workspaceId, messageType);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.warn('Failed to reset rate limits:', error);
      throw new Error('Failed to reset rate limits');
    }
  }
}

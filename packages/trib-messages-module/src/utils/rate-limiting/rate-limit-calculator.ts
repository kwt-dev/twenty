import { Injectable } from '@nestjs/common';

export interface RateLimitConfig {
  minute: number;
  hour: number;
  day: number;
}

export interface WorkspaceRateLimitTier {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  limits: {
    SMS: RateLimitConfig;
    MMS: RateLimitConfig;
  };
}

/**
 * Service for calculating rate limits based on workspace configuration.
 * Provides configurable limits for different message types and tiers.
 */
@Injectable()
export class RateLimitCalculatorService {
  private readonly defaultLimits: Record<string, WorkspaceRateLimitTier> = {
    free: {
      tier: 'free',
      limits: {
        SMS: { minute: 5, hour: 25, day: 100 },
        MMS: { minute: 2, hour: 10, day: 30 },
      },
    },
    basic: {
      tier: 'basic',
      limits: {
        SMS: { minute: 15, hour: 75, day: 300 },
        MMS: { minute: 5, hour: 25, day: 100 },
      },
    },
    premium: {
      tier: 'premium',
      limits: {
        SMS: { minute: 30, hour: 150, day: 600 },
        MMS: { minute: 10, hour: 50, day: 200 },
      },
    },
    enterprise: {
      tier: 'enterprise',
      limits: {
        SMS: { minute: 60, hour: 300, day: 1200 },
        MMS: { minute: 20, hour: 100, day: 400 },
      },
    },
  };

  /**
   * Get rate limits for a workspace and message type.
   * @param workspaceId - Workspace identifier
   * @param messageType - Type of message (SMS or MMS)
   * @returns Rate limit configuration
   */
  getLimits(workspaceId: string, messageType: 'SMS' | 'MMS'): RateLimitConfig {
    const tier = this.getWorkspaceTier(workspaceId);
    const tierConfig = this.defaultLimits[tier];

    return tierConfig.limits[messageType];
  }

  /**
   * Get all rate limits for a workspace.
   * @param workspaceId - Workspace identifier
   * @returns Complete workspace rate limit configuration
   */
  getWorkspaceLimits(workspaceId: string): WorkspaceRateLimitTier {
    const tier = this.getWorkspaceTier(workspaceId);
    return this.defaultLimits[tier];
  }

  /**
   * Calculate time-to-live (TTL) for rate limit keys.
   * @param timeWindow - Time window for rate limiting
   * @returns TTL in seconds
   */
  calculateTTL(timeWindow: 'minute' | 'hour' | 'day'): number {
    const ttlMap = {
      minute: 60,
      hour: 3600,
      day: 86400,
    };

    return ttlMap[timeWindow];
  }

  /**
   * Calculate remaining quota for a rate limit window.
   * @param current - Current usage count
   * @param limit - Maximum allowed count
   * @returns Remaining quota (0 if limit exceeded)
   */
  calculateRemaining(current: number, limit: number): number {
    return Math.max(0, limit - current);
  }

  /**
   * Check if rate limit is exceeded.
   * @param current - Current usage count
   * @param limit - Maximum allowed count
   * @returns True if limit is exceeded
   */
  isLimitExceeded(current: number, limit: number): boolean {
    return current >= limit;
  }

  /**
   * Calculate reset time for a rate limit window.
   * @param timeWindow - Time window for rate limiting
   * @returns Date when the rate limit resets
   */
  calculateResetTime(timeWindow: 'minute' | 'hour' | 'day'): Date {
    const now = new Date();
    const resetTime = new Date(now);

    switch (timeWindow) {
      case 'minute':
        resetTime.setSeconds(0, 0);
        resetTime.setMinutes(resetTime.getMinutes() + 1);
        break;
      case 'hour':
        resetTime.setMinutes(0, 0, 0);
        resetTime.setHours(resetTime.getHours() + 1);
        break;
      case 'day':
        resetTime.setHours(0, 0, 0, 0);
        resetTime.setDate(resetTime.getDate() + 1);
        break;
    }

    return resetTime;
  }

  /**
   * Get workspace tier based on workspace ID.
   * @param workspaceId - Workspace identifier
   * @returns Workspace tier
   */
  private getWorkspaceTier(
    workspaceId: string,
  ): 'free' | 'basic' | 'premium' | 'enterprise' {
    // In a real implementation, this would query the database
    // For now, return a default tier based on workspace ID patterns
    if (workspaceId.includes('enterprise')) {
      return 'enterprise';
    }
    if (workspaceId.includes('premium')) {
      return 'premium';
    }
    if (workspaceId.includes('basic')) {
      return 'basic';
    }

    return 'free';
  }

  /**
   * Get the most restrictive limit across all time windows.
   * @param limits - Rate limit configuration
   * @returns Most restrictive limit info
   */
  getMostRestrictiveLimit(limits: RateLimitConfig): {
    window: 'minute' | 'hour' | 'day';
    limit: number;
  } {
    const ratios = [
      {
        window: 'minute' as const,
        limit: limits.minute,
        ratio: limits.minute / 1,
      },
      { window: 'hour' as const, limit: limits.hour, ratio: limits.hour / 60 },
      { window: 'day' as const, limit: limits.day, ratio: limits.day / 1440 },
    ];

    return ratios.reduce((most, current) =>
      current.ratio < most.ratio ? current : most,
    );
  }
}

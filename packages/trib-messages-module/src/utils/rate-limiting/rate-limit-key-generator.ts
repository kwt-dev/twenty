import { Injectable } from '@nestjs/common';

export interface RateLimitKeyOptions {
  workspaceId: string;
  messageType: 'SMS' | 'MMS';
  timeWindow: 'minute' | 'hour' | 'day';
}

/**
 * Service for generating Redis keys for rate limiting SMS/MMS messages.
 * Creates structured keys for different time windows and message types.
 */
@Injectable()
export class RateLimitKeyGeneratorService {
  private readonly keyPrefix = 'sms:rate_limit';

  /**
   * Generate a Redis key for rate limiting.
   * @param options - Configuration for key generation
   * @returns Redis key string
   */
  generateKey(options: RateLimitKeyOptions): string {
    const { workspaceId, messageType, timeWindow } = options;

    return `${this.keyPrefix}:${workspaceId}:${messageType.toLowerCase()}:${timeWindow}`;
  }

  /**
   * Generate multiple Redis keys for all time windows.
   * @param workspaceId - Workspace identifier
   * @param messageType - Type of message (SMS or MMS)
   * @returns Array of Redis key strings
   */
  generateKeys(workspaceId: string, messageType: 'SMS' | 'MMS'): string[] {
    const timeWindows: Array<'minute' | 'hour' | 'day'> = [
      'minute',
      'hour',
      'day',
    ];

    return timeWindows.map((timeWindow) =>
      this.generateKey({ workspaceId, messageType, timeWindow }),
    );
  }

  /**
   * Generate key for a specific time window.
   * @param workspaceId - Workspace identifier
   * @param messageType - Type of message
   * @param timeWindow - Time window for rate limiting
   * @returns Redis key string
   */
  generateTimeWindowKey(
    workspaceId: string,
    messageType: 'SMS' | 'MMS',
    timeWindow: 'minute' | 'hour' | 'day',
  ): string {
    return this.generateKey({ workspaceId, messageType, timeWindow });
  }

  /**
   * Parse a Redis key to extract metadata.
   * @param key - Redis key to parse
   * @returns Parsed key components or null if invalid
   */
  parseKey(key: string): RateLimitKeyOptions | null {
    const parts = key.split(':');

    if (parts.length !== 5 || parts[0] !== 'sms' || parts[1] !== 'rate_limit') {
      return null;
    }

    const workspaceId = parts[2];
    const messageType = parts[3].toUpperCase() as 'SMS' | 'MMS';
    const timeWindow = parts[4] as 'minute' | 'hour' | 'day';

    if (!['SMS', 'MMS'].includes(messageType)) {
      return null;
    }

    if (!['minute', 'hour', 'day'].includes(timeWindow)) {
      return null;
    }

    return {
      workspaceId,
      messageType,
      timeWindow,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { IRedisClientService } from '../services/sms-rate-limiter.service';

/**
 * Default Redis client implementation for standalone usage
 *
 * This is a simple in-memory implementation for when the module
 * runs without Twenty's Redis infrastructure. In production,
 * this should be overridden via forRoot() with a real Redis client.
 */
@Injectable()
export class DefaultRedisClientService implements IRedisClientService {
  private store = new Map<string, string>();
  private expirations = new Map<string, number>();

  getClient() {
    return {
      get: async (key: string): Promise<string | null> => {
        this.cleanExpired(key);
        return this.store.get(key) || null;
      },

      incr: async (key: string): Promise<number> => {
        this.cleanExpired(key);
        const current = parseInt(this.store.get(key) || '0', 10);
        const newValue = current + 1;
        this.store.set(key, newValue.toString());
        return newValue;
      },

      expire: async (key: string, seconds: number): Promise<number> => {
        const expireAt = Date.now() + seconds * 1000;
        this.expirations.set(key, expireAt);
        return 1;
      },

      del: async (...keys: string[]): Promise<number> => {
        let deleted = 0;
        for (const key of keys) {
          if (this.store.delete(key)) {
            deleted++;
          }
          this.expirations.delete(key);
        }
        return deleted;
      },

      pipeline: () => ({
        incr: (key: string) => this.getClient().incr(key),
        expire: (key: string, seconds: number) =>
          this.getClient().expire(key, seconds),
        exec: async () => {
          // Simple implementation - real Redis pipeline would batch operations
          return [];
        },
      }),
    };
  }

  private cleanExpired(key: string): void {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
    }
  }
}

/**
 * Factory function for creating the default Redis client
 */
export function createDefaultRedisClient(): DefaultRedisClientService {
  return new DefaultRedisClientService();
}

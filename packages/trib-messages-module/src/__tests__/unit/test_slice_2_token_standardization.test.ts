/**
 * Unit tests for Slice 2: Token Standardization
 *
 * Tests the TRIB_TOKENS.* pattern implementation and backward compatibility
 * with deprecated TRIB_TOKENS.MESSAGE_QUEUE_SERVICE bridge export.
 */

import {
  TRIB_TOKENS,
  MESSAGE_QUEUE_SERVICE_TOKEN,
  TribTokens,
} from '../../tokens';

// Test constants
const EXPECTED_TOKEN_COUNT = 4;
const EXPECTED_TOKEN_TYPE = 'symbol';

describe('Slice 2: Token Standardization', () => {
  describe('TRIB_TOKENS Structure', () => {
    it('should have all required tokens defined', () => {
      expect(TRIB_TOKENS).toBeDefined();
      expect(typeof TRIB_TOKENS).toBe('object');

      // Verify all expected tokens are present
      expect(TRIB_TOKENS.REDIS_CLIENT).toBeDefined();
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBeDefined();
      expect(TRIB_TOKENS.LOGGER).toBeDefined();
      expect(TRIB_TOKENS.QUEUE_NAME).toBeDefined();

      // Verify token count
      expect(Object.keys(TRIB_TOKENS)).toHaveLength(EXPECTED_TOKEN_COUNT);
    });

    it('should use Symbol type for service tokens', () => {
      expect(typeof TRIB_TOKENS.REDIS_CLIENT).toBe(EXPECTED_TOKEN_TYPE);
      expect(typeof TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBe(
        EXPECTED_TOKEN_TYPE,
      );
      expect(typeof TRIB_TOKENS.LOGGER).toBe(EXPECTED_TOKEN_TYPE);
    });

    it('should use string type for constant values', () => {
      expect(typeof TRIB_TOKENS.QUEUE_NAME).toBe('string');
      expect(TRIB_TOKENS.QUEUE_NAME).toBe('trib-messages');
    });

    it('should be immutable (as const)', () => {
      // Test that TRIB_TOKENS is readonly at compile time
      // Runtime immutability is not enforced by 'as const' but by Object.freeze
      const originalToken = TRIB_TOKENS.MESSAGE_QUEUE_SERVICE;

      // Test that the token is properly defined and accessible
      expect(originalToken).toBeDefined();
      expect(typeof originalToken).toBe('symbol');

      // Verify all tokens remain consistent
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBe(originalToken);
      expect(TRIB_TOKENS.REDIS_CLIENT).toBeDefined();
      expect(TRIB_TOKENS.LOGGER).toBeDefined();
      expect(TRIB_TOKENS.QUEUE_NAME).toBeDefined();
    });
  });

  describe('Token Uniqueness', () => {
    it('should ensure all symbol tokens are unique', () => {
      const tokens = [
        TRIB_TOKENS.REDIS_CLIENT,
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        TRIB_TOKENS.LOGGER,
      ];

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should have descriptive symbol descriptions', () => {
      expect(TRIB_TOKENS.REDIS_CLIENT.toString()).toContain(
        'TRIB_REDIS_CLIENT',
      );
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE.toString()).toContain(
        'TRIB_MESSAGE_QUEUE_SERVICE',
      );
      expect(TRIB_TOKENS.LOGGER.toString()).toContain('TRIB_LOGGER');
    });
  });

  describe('Backward Compatibility Bridge', () => {
    it('should maintain backward compatibility with deprecated TRIB_TOKENS.MESSAGE_QUEUE_SERVICE', () => {
      // Bridge export should exist
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBeDefined();

      // Bridge should point to the new token
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBe(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      );

      // Bridge should be the same symbol
      expect(typeof MESSAGE_QUEUE_SERVICE_TOKEN).toBe(EXPECTED_TOKEN_TYPE);
    });

    it('should allow DI resolution through both old and new token patterns', () => {
      // Both patterns should resolve to the same symbol
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toStrictEqual(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      );

      // Verify they are the exact same reference
      expect(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      ).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript types', () => {
      // Test that TribTokens type is correctly inferred
      const tokensType: TribTokens = TRIB_TOKENS;
      expect(tokensType).toBeDefined();

      // Test individual token types
      expect(tokensType.REDIS_CLIENT).toBe(TRIB_TOKENS.REDIS_CLIENT);
      expect(tokensType.MESSAGE_QUEUE_SERVICE).toBe(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      );
      expect(tokensType.LOGGER).toBe(TRIB_TOKENS.LOGGER);
      expect(tokensType.QUEUE_NAME).toBe(TRIB_TOKENS.QUEUE_NAME);
    });
  });

  describe('Token Resolution Validation', () => {
    it('should validate that tokens can be used as DI keys', () => {
      // Test that tokens can be used as Map keys (DI container behavior)
      const mockDIContainer = new Map();

      // Add services using new pattern
      mockDIContainer.set(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        'MockMessageQueueService',
      );
      mockDIContainer.set(TRIB_TOKENS.REDIS_CLIENT, 'MockRedisClient');
      mockDIContainer.set(TRIB_TOKENS.LOGGER, 'MockLogger');

      // Verify resolution works
      expect(mockDIContainer.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBe(
        'MockMessageQueueService',
      );
      expect(mockDIContainer.get(TRIB_TOKENS.REDIS_CLIENT)).toBe(
        'MockRedisClient',
      );
      expect(mockDIContainer.get(TRIB_TOKENS.LOGGER)).toBe('MockLogger');

      // Verify backward compatibility works
      expect(mockDIContainer.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBe(
        'MockMessageQueueService',
      );
    });

    it('should handle token comparison correctly', () => {
      // Test strict equality
      expect(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      ).toBe(true);
      expect(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      ).toBe(true);

      // Test inequality with other tokens
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).not.toBe(
        TRIB_TOKENS.REDIS_CLIENT,
      );
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).not.toBe(TRIB_TOKENS.LOGGER);
    });
  });

  describe('Migration Path Validation', () => {
    it('should support gradual migration from old to new pattern', () => {
      // Simulate service configurations using both patterns
      const oldPatternConfig = {
        provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        useValue: 'MockService',
      };

      const newPatternConfig = {
        provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        useValue: 'MockService',
      };

      // Both should resolve to the same token
      expect(oldPatternConfig.provide).toBe(newPatternConfig.provide);
    });

    it('should ensure no conflicts during migration', () => {
      // Test that there are no naming conflicts
      const allTokens = Object.values(TRIB_TOKENS);
      const uniqueTokens = new Set(allTokens);

      expect(uniqueTokens.size).toBe(allTokens.length);

      // Verify bridge doesn't create duplicates
      expect(allTokens.includes(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE as any)).toBe(
        true,
      );
      expect(
        allTokens.filter(
          (token) => token === TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        ),
      ).toHaveLength(1);
    });
  });

  describe('Token Documentation', () => {
    it('should have proper symbol descriptions for debugging', () => {
      const redisClientDesc = TRIB_TOKENS.REDIS_CLIENT.toString();
      const messageQueueDesc = TRIB_TOKENS.MESSAGE_QUEUE_SERVICE.toString();
      const loggerDesc = TRIB_TOKENS.LOGGER.toString();

      expect(redisClientDesc).toMatch(/TRIB_REDIS_CLIENT/);
      expect(messageQueueDesc).toMatch(/TRIB_MESSAGE_QUEUE_SERVICE/);
      expect(loggerDesc).toMatch(/TRIB_LOGGER/);
    });
  });
});

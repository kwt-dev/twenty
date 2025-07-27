import {
  validateThreadStatus,
  validateThreadSubject,
  validateThreadParticipants,
  validateThreadTags,
  validateMessageCount,
  validateThreadMetadata,
} from '../utils/validation/thread-validator';
import { TribThreadStatus } from '../types/thread-enums';

describe('Thread Validator Functions', () => {
  describe('validateThreadStatus', () => {
    it('should validate valid thread statuses', () => {
      expect(validateThreadStatus('active')).toBe(true);
      expect(validateThreadStatus('archived')).toBe(true);
      expect(validateThreadStatus('blocked')).toBe(true);
      expect(validateThreadStatus('closed')).toBe(true);
      expect(validateThreadStatus('paused')).toBe(true);
    });

    it('should reject invalid thread statuses', () => {
      expect(validateThreadStatus('invalid')).toBe(false);
      expect(validateThreadStatus('ACTIVE')).toBe(false);
      expect(validateThreadStatus('')).toBe(false);
      expect(validateThreadStatus('pending')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateThreadStatus(123 as any)).toBe(false);
      expect(validateThreadStatus(null as any)).toBe(false);
      expect(validateThreadStatus(undefined as any)).toBe(false);
      expect(validateThreadStatus([] as any)).toBe(false);
      expect(validateThreadStatus({} as any)).toBe(false);
    });
  });

  describe('validateThreadSubject', () => {
    it('should validate valid subjects', () => {
      expect(validateThreadSubject('Valid Subject')).toBe(true);
      expect(validateThreadSubject('A')).toBe(true);
      expect(validateThreadSubject('Customer Support - Product Question')).toBe(
        true,
      );
      expect(validateThreadSubject('  Valid Subject  ')).toBe(true); // Should trim
    });

    it('should validate subject at maximum length', () => {
      const maxLengthSubject = 'a'.repeat(200);
      expect(validateThreadSubject(maxLengthSubject)).toBe(true);
    });

    it('should reject empty subjects', () => {
      expect(validateThreadSubject('')).toBe(false);
      expect(validateThreadSubject('   ')).toBe(false);
    });

    it('should reject overly long subjects', () => {
      const longSubject = 'a'.repeat(201);
      expect(validateThreadSubject(longSubject)).toBe(false);
    });

    it('should reject non-string subjects', () => {
      expect(validateThreadSubject(123 as any)).toBe(false);
      expect(validateThreadSubject(null as any)).toBe(false);
      expect(validateThreadSubject(undefined as any)).toBe(false);
      expect(validateThreadSubject([] as any)).toBe(false);
      expect(validateThreadSubject({} as any)).toBe(false);
    });
  });

  describe('validateThreadParticipants', () => {
    it('should validate valid participants arrays', () => {
      expect(validateThreadParticipants(['+1234567890'])).toBe(true);
      expect(validateThreadParticipants(['+1234567890', '+0987654321'])).toBe(
        true,
      );
      expect(validateThreadParticipants(['user@example.com'])).toBe(true);
      expect(
        validateThreadParticipants(['user1@example.com', 'user2@example.com']),
      ).toBe(true);
    });

    it('should validate at maximum number of participants', () => {
      const maxParticipants = Array(100)
        .fill(0)
        .map((_, i) => `+123456789${i.toString().padStart(2, '0')}`);
      expect(validateThreadParticipants(maxParticipants)).toBe(true);
    });

    it('should reject empty arrays', () => {
      expect(validateThreadParticipants([])).toBe(false);
    });

    it('should reject too many participants', () => {
      const tooManyParticipants = Array(101)
        .fill(0)
        .map((_, i) => `+123456789${i.toString().padStart(3, '0')}`);
      expect(validateThreadParticipants(tooManyParticipants)).toBe(false);
    });

    it('should reject non-array inputs', () => {
      expect(validateThreadParticipants('not-an-array' as any)).toBe(false);
      expect(validateThreadParticipants(null as any)).toBe(false);
      expect(validateThreadParticipants(undefined as any)).toBe(false);
      expect(validateThreadParticipants({} as any)).toBe(false);
    });

    it('should reject arrays with invalid participants', () => {
      expect(validateThreadParticipants([''])).toBe(false);
      expect(validateThreadParticipants(['   '])).toBe(false);
      expect(validateThreadParticipants([123 as any])).toBe(false);
      expect(validateThreadParticipants([null as any])).toBe(false);
      expect(validateThreadParticipants([undefined as any])).toBe(false);
    });

    it('should reject participants with overly long identifiers', () => {
      const longParticipant = 'a'.repeat(51);
      expect(validateThreadParticipants([longParticipant])).toBe(false);
    });

    it('should validate participants at maximum length', () => {
      const maxLengthParticipant = 'a'.repeat(50);
      expect(validateThreadParticipants([maxLengthParticipant])).toBe(true);
    });

    it('should reject mixed valid and invalid participants', () => {
      expect(validateThreadParticipants(['+1234567890', ''])).toBe(false);
      expect(validateThreadParticipants(['+1234567890', 123 as any])).toBe(
        false,
      );
    });
  });

  describe('validateThreadTags', () => {
    it('should validate valid tags arrays', () => {
      expect(validateThreadTags([])).toBe(true);
      expect(validateThreadTags(['tag1'])).toBe(true);
      expect(validateThreadTags(['tag1', 'tag2'])).toBe(true);
      expect(validateThreadTags(['urgent', 'customer-service', 'vip'])).toBe(
        true,
      );
    });

    it('should validate at maximum number of tags', () => {
      const maxTags = Array(20)
        .fill(0)
        .map((_, i) => `tag${i}`);
      expect(validateThreadTags(maxTags)).toBe(true);
    });

    it('should reject too many tags', () => {
      const tooManyTags = Array(21)
        .fill(0)
        .map((_, i) => `tag${i}`);
      expect(validateThreadTags(tooManyTags)).toBe(false);
    });

    it('should reject non-array inputs', () => {
      expect(validateThreadTags('not-an-array' as any)).toBe(false);
      expect(validateThreadTags(null as any)).toBe(false);
      expect(validateThreadTags(undefined as any)).toBe(false);
      expect(validateThreadTags({} as any)).toBe(false);
    });

    it('should reject arrays with invalid tags', () => {
      expect(validateThreadTags([''])).toBe(false);
      expect(validateThreadTags(['   '])).toBe(false);
      expect(validateThreadTags([123 as any])).toBe(false);
      expect(validateThreadTags([null as any])).toBe(false);
      expect(validateThreadTags([undefined as any])).toBe(false);
    });

    it('should reject tags with overly long names', () => {
      const longTag = 'a'.repeat(31);
      expect(validateThreadTags([longTag])).toBe(false);
    });

    it('should validate tags at maximum length', () => {
      const maxLengthTag = 'a'.repeat(30);
      expect(validateThreadTags([maxLengthTag])).toBe(true);
    });

    it('should reject mixed valid and invalid tags', () => {
      expect(validateThreadTags(['valid', ''])).toBe(false);
      expect(validateThreadTags(['valid', 123 as any])).toBe(false);
    });
  });

  describe('validateMessageCount', () => {
    it('should validate valid message counts', () => {
      expect(validateMessageCount(0)).toBe(true);
      expect(validateMessageCount(1)).toBe(true);
      expect(validateMessageCount(100)).toBe(true);
      expect(validateMessageCount(1000)).toBe(true);
      expect(validateMessageCount(999999)).toBe(true);
    });

    it('should validate at maximum message count', () => {
      expect(validateMessageCount(1000000)).toBe(true);
    });

    it('should reject negative message counts', () => {
      expect(validateMessageCount(-1)).toBe(false);
      expect(validateMessageCount(-100)).toBe(false);
    });

    it('should reject overly large message counts', () => {
      expect(validateMessageCount(1000001)).toBe(false);
      expect(validateMessageCount(10000000)).toBe(false);
    });

    it('should reject non-integer message counts', () => {
      expect(validateMessageCount(1.5)).toBe(false);
      expect(validateMessageCount(100.1)).toBe(false);
      expect(validateMessageCount(0.5)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(validateMessageCount('123' as any)).toBe(false);
      expect(validateMessageCount(null as any)).toBe(false);
      expect(validateMessageCount(undefined as any)).toBe(false);
      expect(validateMessageCount([] as any)).toBe(false);
      expect(validateMessageCount({} as any)).toBe(false);
    });

    it('should reject special number values', () => {
      expect(validateMessageCount(NaN)).toBe(false);
      expect(validateMessageCount(Infinity)).toBe(false);
      expect(validateMessageCount(-Infinity)).toBe(false);
    });
  });

  describe('validateThreadMetadata', () => {
    it('should validate valid metadata objects', () => {
      expect(validateThreadMetadata({})).toBe(true);
      expect(validateThreadMetadata({ key: 'value' })).toBe(true);
      expect(validateThreadMetadata({ key1: 'value1', key2: 'value2' })).toBe(
        true,
      );
      expect(
        validateThreadMetadata({
          string: 'value',
          number: 123,
          boolean: true,
          nested: { key: 'value' },
        }),
      ).toBe(true);
    });

    it('should validate null and undefined metadata', () => {
      expect(validateThreadMetadata(null as any)).toBe(true);
      expect(validateThreadMetadata(undefined as any)).toBe(true);
    });

    it('should reject non-object metadata', () => {
      expect(validateThreadMetadata('string' as any)).toBe(false);
      expect(validateThreadMetadata(123 as any)).toBe(false);
      expect(validateThreadMetadata(true as any)).toBe(false);
    });

    it('should reject array metadata', () => {
      expect(validateThreadMetadata([] as any)).toBe(false);
      expect(validateThreadMetadata([1, 2, 3] as any)).toBe(false);
    });

    it('should reject overly large metadata objects', () => {
      // Create a large object that will exceed 10KB when serialized
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = 'a'.repeat(50); // Each entry is ~55 chars
      }
      expect(validateThreadMetadata(largeObject)).toBe(false);
    });

    it('should validate metadata at reasonable size', () => {
      const reasonableObject: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        reasonableObject[`key${i}`] = 'value';
      }
      expect(validateThreadMetadata(reasonableObject)).toBe(true);
    });

    it('should reject metadata with circular references', () => {
      const circularObject: any = { key: 'value' };
      circularObject.self = circularObject;
      expect(validateThreadMetadata(circularObject)).toBe(false);
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        user: {
          id: 123,
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            notifications: true,
            settings: {
              language: 'en',
              timezone: 'UTC',
            },
          },
        },
        thread: {
          created: new Date().toISOString(),
          tags: ['support', 'urgent'],
          metadata: {
            source: 'web',
            version: '1.0',
          },
        },
      };
      expect(validateThreadMetadata(complexObject)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings in all validators', () => {
      expect(validateThreadStatus('')).toBe(false);
      expect(validateThreadSubject('')).toBe(false);
      expect(validateThreadParticipants([''])).toBe(false);
      expect(validateThreadTags([''])).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      expect(validateThreadStatus('   ')).toBe(false);
      expect(validateThreadSubject('   ')).toBe(false);
      expect(validateThreadParticipants(['   '])).toBe(false);
      expect(validateThreadTags(['   '])).toBe(false);
    });

    it('should handle null and undefined values appropriately', () => {
      // Only threadMetadata should accept null/undefined
      expect(validateThreadStatus(null as any)).toBe(false);
      expect(validateThreadSubject(null as any)).toBe(false);
      expect(validateThreadParticipants(null as any)).toBe(false);
      expect(validateThreadTags(null as any)).toBe(false);
      expect(validateMessageCount(null as any)).toBe(false);
      expect(validateThreadMetadata(null as any)).toBe(true);

      expect(validateThreadStatus(undefined as any)).toBe(false);
      expect(validateThreadSubject(undefined as any)).toBe(false);
      expect(validateThreadParticipants(undefined as any)).toBe(false);
      expect(validateThreadTags(undefined as any)).toBe(false);
      expect(validateMessageCount(undefined as any)).toBe(false);
      expect(validateThreadMetadata(undefined as any)).toBe(true);
    });

    it('should handle special character inputs', () => {
      expect(validateThreadSubject('Subject with émojis 🎉')).toBe(true);
      expect(validateThreadParticipants(['user@émoji.com'])).toBe(true);
      expect(
        validateThreadTags(['tag-with-dashes', 'tag_with_underscores']),
      ).toBe(true);
    });

    it('should handle boundary conditions', () => {
      // Test exactly at boundaries
      expect(validateThreadSubject('a'.repeat(200))).toBe(true);
      expect(validateThreadSubject('a'.repeat(201))).toBe(false);

      expect(validateThreadParticipants(Array(100).fill('a'))).toBe(true);
      expect(validateThreadParticipants(Array(101).fill('a'))).toBe(false);

      expect(validateThreadTags(Array(20).fill('a'))).toBe(true);
      expect(validateThreadTags(Array(21).fill('a'))).toBe(false);

      expect(validateMessageCount(1000000)).toBe(true);
      expect(validateMessageCount(1000001)).toBe(false);
    });
  });
});

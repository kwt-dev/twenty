import {
  generateTribUuid,
  isValidTribUuid,
  parseTribUuid,
} from '../utils/uuid-generator';

describe('UUID Generator', () => {
  describe('generateTribUuid', () => {
    it('should generate UUID with correct format', () => {
      const uuid = generateTribUuid('MSG', 1);
      expect(uuid).toMatch(/^20202020-MSG0-0001-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should pad category to 4 characters', () => {
      const uuid = generateTribUuid('A', 1);
      expect(uuid).toMatch(/^20202020-A000-0001-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should truncate category to 4 characters', () => {
      const uuid = generateTribUuid('VERYLONGCATEGORY', 1);
      expect(uuid).toMatch(/^20202020-VERY-0001-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should pad index to 4 digits', () => {
      const uuid = generateTribUuid('MSG', 42);
      expect(uuid).toMatch(/^20202020-MSG0-0042-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should handle maximum index value', () => {
      const uuid = generateTribUuid('MSG', 9999);
      expect(uuid).toMatch(/^20202020-MSG0-9999-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should convert category to uppercase', () => {
      const uuid = generateTribUuid('msg', 1);
      expect(uuid).toMatch(/^20202020-MSG0-0001-[0-9A-F]{4}-[0-9A-F]{12}$/i);
    });

    it('should throw error for empty category', () => {
      expect(() => generateTribUuid('', 1)).toThrow('Category cannot be empty');
    });

    it('should throw error for negative index', () => {
      expect(() => generateTribUuid('MSG', -1)).toThrow(
        'Index must be between 0 and 9999',
      );
    });

    it('should throw error for index greater than 9999', () => {
      expect(() => generateTribUuid('MSG', 10000)).toThrow(
        'Index must be between 0 and 9999',
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateTribUuid('MSG', 1);
      const uuid2 = generateTribUuid('MSG', 1);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isValidTribUuid', () => {
    it('should return true for valid TRIB UUID', () => {
      const validUuid = '20202020-MSG0-0001-1A2B-3C4D5E6F7890';
      expect(isValidTribUuid(validUuid)).toBe(true);
    });

    it('should return false for invalid format', () => {
      const invalidUuid = '12345678-MSG0-0001-1A2B-3C4D5E6F7890';
      expect(isValidTribUuid(invalidUuid)).toBe(false);
    });

    it('should return false for incorrect prefix', () => {
      const invalidUuid = '20202021-MSG0-0001-1A2B-3C4D5E6F7890';
      expect(isValidTribUuid(invalidUuid)).toBe(false);
    });

    it('should return false for standard UUID', () => {
      const standardUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidTribUuid(standardUuid)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidTribUuid('')).toBe(false);
    });

    it('should return false for malformed UUID', () => {
      const malformedUuid = '20202020-MSG0-001-1A2B-3C4D5E6F7890';
      expect(isValidTribUuid(malformedUuid)).toBe(false);
    });
  });

  describe('parseTribUuid', () => {
    it('should parse valid TRIB UUID correctly', () => {
      const uuid = '20202020-MSG0-0001-1A2B-3C4D5E6F7890';
      const parsed = parseTribUuid(uuid);
      expect(parsed).toEqual({ category: 'MSG', index: 1 });
    });

    it('should handle padded category', () => {
      const uuid = '20202020-A000-0042-1A2B-3C4D5E6F7890';
      const parsed = parseTribUuid(uuid);
      expect(parsed).toEqual({ category: 'A', index: 42 });
    });

    it('should handle zero index', () => {
      const uuid = '20202020-TEST-0000-1A2B-3C4D5E6F7890';
      const parsed = parseTribUuid(uuid);
      expect(parsed).toEqual({ category: 'TEST', index: 0 });
    });

    it('should handle maximum index', () => {
      const uuid = '20202020-MSG0-9999-1A2B-3C4D5E6F7890';
      const parsed = parseTribUuid(uuid);
      expect(parsed).toEqual({ category: 'MSG', index: 9999 });
    });

    it('should return null for invalid UUID', () => {
      const invalidUuid = '12345678-MSG0-0001-1A2B-3C4D5E6F7890';
      const parsed = parseTribUuid(invalidUuid);
      expect(parsed).toBeNull();
    });

    it('should return null for empty string', () => {
      const parsed = parseTribUuid('');
      expect(parsed).toBeNull();
    });
  });

  describe('Integration tests', () => {
    it('should generate and parse UUID correctly', () => {
      const category = 'TEST';
      const index = 123;
      const uuid = generateTribUuid(category, index);
      const parsed = parseTribUuid(uuid);

      expect(parsed).toEqual({ category, index });
      expect(isValidTribUuid(uuid)).toBe(true);
    });

    it('should handle edge cases in integration', () => {
      const testCases = [
        { category: 'A', index: 0 },
        { category: 'VERY', index: 9999 },
        { category: 'msg', index: 1 },
      ];

      testCases.forEach(({ category, index }) => {
        const uuid = generateTribUuid(category, index);
        const parsed = parseTribUuid(uuid);

        expect(parsed).toEqual({
          category: category.toUpperCase().substring(0, 4),
          index,
        });
        expect(isValidTribUuid(uuid)).toBe(true);
      });
    });
  });
});

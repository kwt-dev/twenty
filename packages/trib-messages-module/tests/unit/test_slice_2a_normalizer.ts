/**
 * Unit Tests for Phone Normalizer Utilities
 * Slice 2a: Phone Number Utilities - Twenty CRM TRIB SMS Integration
 */

import {
  normalizePhoneNumber,
  getPhoneVariations,
  arePhoneNumbersEqual,
} from '../../src/utils/phone/phone-normalizer';

describe('Phone Normalizer Utilities', () => {
  describe('normalizePhoneNumber', () => {
    it('should normalize US phone numbers to E.164 format', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567');
      expect(normalizePhoneNumber('555-123-4567')).toBe('+15551234567');
      expect(normalizePhoneNumber('555.123.4567')).toBe('+15551234567');
      expect(normalizePhoneNumber('5551234567')).toBe('+15551234567');
      expect(normalizePhoneNumber('15551234567')).toBe('+15551234567');
      expect(normalizePhoneNumber('+1 555 123 4567')).toBe('+15551234567');
    });

    it('should handle international phone numbers', () => {
      expect(normalizePhoneNumber('+44 20 7946 0958', 'GB')).toBe(
        '+442079460958',
      );
      expect(normalizePhoneNumber('20 7946 0958', 'GB')).toBe('+442079460958');
      expect(normalizePhoneNumber('+49 30 12345678', 'DE')).toBe(
        '+493012345678',
      );
    });

    it('should return null for invalid phone numbers', () => {
      expect(normalizePhoneNumber('123')).toBeNull();
      expect(normalizePhoneNumber('abc')).toBeNull();
      expect(normalizePhoneNumber('555-abc-1234')).toBeNull();
      expect(normalizePhoneNumber('')).toBeNull();
      expect(normalizePhoneNumber('   ')).toBeNull();
    });

    it('should handle null and undefined inputs securely', () => {
      expect(normalizePhoneNumber(null as any)).toBeNull();
      expect(normalizePhoneNumber(undefined as any)).toBeNull();
    });

    it('should reject overly long phone numbers for security', () => {
      const longPhone = '1'.repeat(51);
      expect(normalizePhoneNumber(longPhone)).toBeNull();
    });

    it('should handle edge case phone numbers', () => {
      expect(normalizePhoneNumber('011-44-20-7946-0958')).toBe('+442079460958');
      expect(normalizePhoneNumber('+1-555-123-4567')).toBe('+15551234567');
    });
  });

  describe('getPhoneVariations', () => {
    it('should generate variations for US phone numbers', () => {
      const variations = getPhoneVariations('(555) 123-4567');

      expect(variations).toContain('+15551234567'); // E.164 format
      expect(variations).toContain('15551234567'); // Without +
      expect(variations).toContain('5551234567'); // Without country code
      expect(variations).toContain('(555) 123-4567'); // Formatted
      expect(variations).toContain('555-123-4567'); // Dash format

      expect(variations.length).toBeGreaterThan(3);
    });

    it('should handle invalid phone numbers gracefully', () => {
      const variations = getPhoneVariations('invalid');
      expect(variations).toEqual(['invalid']);
    });

    it('should generate variations for international numbers', () => {
      const variations = getPhoneVariations('+44 20 7946 0958');
      expect(variations).toContain('+442079460958');
      expect(variations).toContain('442079460958');
    });

    it('should handle empty strings', () => {
      const variations = getPhoneVariations('');
      expect(variations).toEqual(['']);
    });

    it('should remove duplicates from variations', () => {
      const variations = getPhoneVariations('+15551234567');
      const uniqueVariations = [...new Set(variations)];
      expect(variations.length).toBe(uniqueVariations.length);
    });
  });

  describe('arePhoneNumbersEqual', () => {
    it('should recognize equivalent US phone numbers', () => {
      expect(arePhoneNumbersEqual('(555) 123-4567', '555-123-4567')).toBe(true);
      expect(arePhoneNumbersEqual('5551234567', '+15551234567')).toBe(true);
      expect(arePhoneNumbersEqual('555.123.4567', '(555) 123-4567')).toBe(true);
      expect(arePhoneNumbersEqual('+1 555 123 4567', '15551234567')).toBe(true);
    });

    it('should recognize different phone numbers', () => {
      expect(arePhoneNumbersEqual('(555) 123-4567', '(555) 123-4568')).toBe(
        false,
      );
      expect(arePhoneNumbersEqual('5551234567', '5551234568')).toBe(false);
      expect(arePhoneNumbersEqual('+15551234567', '+15551234568')).toBe(false);
    });

    it('should handle international numbers', () => {
      expect(
        arePhoneNumbersEqual('+44 20 7946 0958', '20 7946 0958', 'GB'),
      ).toBe(true);
      expect(
        arePhoneNumbersEqual('+49 30 12345678', '030 12345678', 'DE'),
      ).toBe(true);
    });

    it('should handle invalid phone numbers', () => {
      expect(arePhoneNumbersEqual('invalid', '(555) 123-4567')).toBe(false);
      expect(arePhoneNumbersEqual('(555) 123-4567', 'invalid')).toBe(false);
      expect(arePhoneNumbersEqual('invalid', 'also-invalid')).toBe(false);
    });

    it('should handle empty and null inputs', () => {
      expect(arePhoneNumbersEqual('', '(555) 123-4567')).toBe(false);
      expect(arePhoneNumbersEqual('(555) 123-4567', '')).toBe(false);
      expect(arePhoneNumbersEqual('', '')).toBe(false);
    });

    it('should be case insensitive for country codes', () => {
      expect(
        arePhoneNumbersEqual('+44 20 7946 0958', '20 7946 0958', 'gb' as any),
      ).toBe(true);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle malformed inputs without crashing', () => {
      const malformedInputs = [
        '++1234567890',
        '--5551234567',
        '555-123-456789012345',
        'tel:+15551234567',
        'phone: (555) 123-4567',
      ];

      malformedInputs.forEach((input) => {
        expect(() => normalizePhoneNumber(input)).not.toThrow();
        expect(() => getPhoneVariations(input)).not.toThrow();
        expect(() => arePhoneNumbersEqual(input, '5551234567')).not.toThrow();
      });
    });

    it('should handle special characters in phone numbers', () => {
      expect(normalizePhoneNumber('555-123-4567 ext. 123')).toBeNull();
      expect(normalizePhoneNumber('555-123-4567#123')).toBeNull();
      expect(normalizePhoneNumber('(555) 123-4567 x123')).toBeNull();
    });

    it('should reject extremely long phone numbers', () => {
      const attackString = '+1' + '5'.repeat(100);
      expect(normalizePhoneNumber(attackString)).toBeNull();
    });
  });
});

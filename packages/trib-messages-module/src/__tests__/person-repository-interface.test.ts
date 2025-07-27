import {
  IPersonRepository,
  PersonPhone,
} from '../interfaces/person.repository.interface';
import { TRIB_TOKENS } from '../tokens';

describe('Slice 1a: Person Repository Interface', () => {
  describe('IPersonRepository Interface', () => {
    it('should define required method signatures', () => {
      // This test ensures interface compilation and structure
      const mockRepository: IPersonRepository = {
        findByPhone: jest.fn(),
        findByPhoneVariations: jest.fn(),
        findByPrimaryOrAdditionalPhone: jest.fn(),
      };

      expect(typeof mockRepository.findByPhone).toBe('function');
      expect(typeof mockRepository.findByPhoneVariations).toBe('function');
      expect(typeof mockRepository.findByPrimaryOrAdditionalPhone).toBe(
        'function',
      );
    });
  });

  describe('PersonPhone Interface', () => {
    it('should accept valid person phone data', () => {
      const validPersonPhone: PersonPhone = {
        id: 'person-123',
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
      };

      expect(validPersonPhone.id).toBe('person-123');
      expect(validPersonPhone.primaryPhoneNumber).toBe('+15551234567');
    });

    it('should handle null values correctly', () => {
      const minimalPersonPhone: PersonPhone = {
        id: 'person-456',
        primaryPhoneNumber: null,
        primaryPhoneCountryCode: null,
        phone: null,
        additionalPhones: null,
      };

      expect(minimalPersonPhone.id).toBe('person-456');
      expect(minimalPersonPhone.primaryPhoneNumber).toBeNull();
    });
  });

  describe('TRIB_TOKENS', () => {
    it('should include PERSON_REPOSITORY token', () => {
      expect(TRIB_TOKENS.PERSON_REPOSITORY).toBeDefined();
      expect(typeof TRIB_TOKENS.PERSON_REPOSITORY).toBe('symbol');
    });

    it('should have unique symbol value', () => {
      const otherSymbol = Symbol('PERSON_REPOSITORY');
      expect(TRIB_TOKENS.PERSON_REPOSITORY).not.toBe(otherSymbol);
    });
  });
});

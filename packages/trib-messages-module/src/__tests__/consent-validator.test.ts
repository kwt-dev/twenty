/**
 * @fileoverview Unit tests for consent validator functions
 * Tests all consent validation functions for TCPA compliance
 */

import {
  validateConsentStatus,
  validatePhoneNumber,
  validateConsentSource,
  validateConsentDates,
  validateConsentTransition,
  validateConsentRecord,
  validateConsentMetadata,
  getValidConsentTransitions,
  isConsentExpired,
  consentValidator,
  ConsentDates,
  ConsentRecord,
} from '../utils/validation/consent-validator';
import {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
} from '../types/consent-enums';

describe('validateConsentStatus', () => {
  const mockOptInDate = new Date('2023-01-01');
  const mockOptOutDate = new Date('2023-06-01');

  describe('OPTED_IN status', () => {
    it('should validate OPTED_IN with opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_IN, {
          optInDate: mockOptInDate,
        }),
      ).toBe(true);
    });

    it('should fail OPTED_IN without opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_IN, { optInDate: null }),
      ).toBe(false);
      expect(validateConsentStatus(ConsentStatus.OPTED_IN, {})).toBe(false);
    });

    it('should fail OPTED_IN with opt-out date after opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_IN, {
          optInDate: mockOptInDate,
          optOutDate: mockOptOutDate,
        }),
      ).toBe(false);
    });

    it('should pass OPTED_IN with opt-out date before opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_IN, {
          optInDate: mockOptOutDate,
          optOutDate: mockOptInDate,
        }),
      ).toBe(true);
    });
  });

  describe('OPTED_OUT status', () => {
    it('should validate OPTED_OUT with opt-out date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_OUT, {
          optOutDate: mockOptOutDate,
        }),
      ).toBe(true);
    });

    it('should fail OPTED_OUT without opt-out date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_OUT, { optOutDate: null }),
      ).toBe(false);
      expect(validateConsentStatus(ConsentStatus.OPTED_OUT, {})).toBe(false);
    });

    it('should pass OPTED_OUT with opt-out date after opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_OUT, {
          optInDate: mockOptInDate,
          optOutDate: mockOptOutDate,
        }),
      ).toBe(true);
    });

    it('should fail OPTED_OUT with opt-out date before opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.OPTED_OUT, {
          optInDate: mockOptOutDate,
          optOutDate: mockOptInDate,
        }),
      ).toBe(false);
    });
  });

  describe('PENDING status', () => {
    it('should validate PENDING without dates', () => {
      expect(validateConsentStatus(ConsentStatus.PENDING, {})).toBe(true);
    });

    it('should fail PENDING with opt-in date', () => {
      expect(
        validateConsentStatus(ConsentStatus.PENDING, {
          optInDate: mockOptInDate,
        }),
      ).toBe(false);
    });

    it('should fail PENDING with opt-out date', () => {
      expect(
        validateConsentStatus(ConsentStatus.PENDING, {
          optOutDate: mockOptOutDate,
        }),
      ).toBe(false);
    });

    it('should fail PENDING with both dates', () => {
      expect(
        validateConsentStatus(ConsentStatus.PENDING, {
          optInDate: mockOptInDate,
          optOutDate: mockOptOutDate,
        }),
      ).toBe(false);
    });
  });

  describe('UNKNOWN status', () => {
    it('should validate UNKNOWN without dates', () => {
      expect(validateConsentStatus(ConsentStatus.UNKNOWN, {})).toBe(true);
    });

    it('should validate UNKNOWN with dates', () => {
      expect(
        validateConsentStatus(ConsentStatus.UNKNOWN, {
          optInDate: mockOptInDate,
        }),
      ).toBe(true);
      expect(
        validateConsentStatus(ConsentStatus.UNKNOWN, {
          optOutDate: mockOptOutDate,
        }),
      ).toBe(true);
      expect(
        validateConsentStatus(ConsentStatus.UNKNOWN, {
          optInDate: mockOptInDate,
          optOutDate: mockOptOutDate,
        }),
      ).toBe(true);
    });
  });

  describe('Invalid status', () => {
    it('should fail with invalid status', () => {
      expect(validateConsentStatus('INVALID_STATUS', {})).toBe(false);
      expect(validateConsentStatus('', {})).toBe(false);
      expect(validateConsentStatus('opted_in', {})).toBe(false);
    });
  });
});

describe('validatePhoneNumber', () => {
  describe('Valid phone numbers', () => {
    it('should validate 10-digit US numbers', () => {
      expect(validatePhoneNumber('2345678901')).toBe(true);
      expect(validatePhoneNumber('2125551234')).toBe(true);
      expect(validatePhoneNumber('4155551212')).toBe(true);
    });

    it('should validate 11-digit US numbers with country code', () => {
      expect(validatePhoneNumber('12345678901')).toBe(true);
      expect(validatePhoneNumber('12125551234')).toBe(true);
      expect(validatePhoneNumber('14155551212')).toBe(true);
    });

    it('should validate formatted phone numbers', () => {
      expect(validatePhoneNumber('(234) 567-8901')).toBe(true);
      expect(validatePhoneNumber('+1 (212) 555-1234')).toBe(true);
      expect(validatePhoneNumber('1-415-555-1212')).toBe(true);
      expect(validatePhoneNumber('+1 212.555.1234')).toBe(true);
    });

    it('should validate international numbers', () => {
      expect(validatePhoneNumber('+447911123456')).toBe(true); // UK: 12 digits
      expect(validatePhoneNumber('+4915123456789')).toBe(true); // Germany: 13 digits
      expect(validatePhoneNumber('+8613812345678')).toBe(true); // China: 13 digits
    });
  });

  describe('Invalid phone numbers', () => {
    it('should reject numbers with invalid area codes', () => {
      expect(validatePhoneNumber('0345678901')).toBe(false); // Area code starts with 0
      expect(validatePhoneNumber('1345678901')).toBe(false); // Area code starts with 1
    });

    it('should validate numbers that libphonenumber-js considers valid', () => {
      // These numbers were historically invalid but libphonenumber-js accepts them
      expect(validatePhoneNumber('2045678901')).toBe(true); // Exchange starts with 0
      expect(validatePhoneNumber('2145678901')).toBe(true); // Exchange starts with 1
    });

    it('should reject numbers that are too short', () => {
      expect(validatePhoneNumber('123456789')).toBe(false); // 9 digits
      expect(validatePhoneNumber('12345')).toBe(false); // 5 digits
      expect(validatePhoneNumber('555')).toBe(false); // 3 digits
    });

    it('should reject numbers that are too long', () => {
      expect(validatePhoneNumber('1234567890123456')).toBe(false); // 16 digits
      expect(validatePhoneNumber('12345678901234567890')).toBe(false); // 20 digits
    });

    it('should reject invalid 11-digit numbers', () => {
      expect(validatePhoneNumber('22345678901')).toBe(false); // Doesn't start with 1
      expect(validatePhoneNumber('92345678901')).toBe(false); // Doesn't start with 1
    });

    it('should reject empty or null values', () => {
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber(null as any)).toBe(false);
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validatePhoneNumber(1234567890 as any)).toBe(false);
      expect(validatePhoneNumber({} as any)).toBe(false);
      expect(validatePhoneNumber([] as any)).toBe(false);
    });
  });
});

describe('validateConsentSource', () => {
  it('should validate all valid consent sources', () => {
    expect(validateConsentSource(ConsentSource.WEB_FORM)).toBe(true);
    expect(validateConsentSource(ConsentSource.SMS_KEYWORD)).toBe(true);
    expect(validateConsentSource(ConsentSource.API)).toBe(true);
    expect(validateConsentSource(ConsentSource.PHONE_CALL)).toBe(true);
    expect(validateConsentSource(ConsentSource.EMAIL)).toBe(true);
    expect(validateConsentSource(ConsentSource.MOBILE_APP)).toBe(true);
    expect(validateConsentSource(ConsentSource.INTEGRATION)).toBe(true);
    expect(validateConsentSource(ConsentSource.MANUAL)).toBe(true);
    expect(validateConsentSource(ConsentSource.UNKNOWN)).toBe(true);
  });

  it('should reject invalid consent sources', () => {
    expect(validateConsentSource('INVALID_SOURCE')).toBe(false);
    expect(validateConsentSource('')).toBe(false);
    expect(validateConsentSource('web_form')).toBe(false);
    expect(validateConsentSource('WEB FORM')).toBe(false);
  });
});

describe('validateConsentDates', () => {
  const pastDate = new Date('2023-01-01');
  const laterDate = new Date('2023-06-01');
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

  describe('Opt-in and opt-out date consistency', () => {
    it('should validate when opt-out is after opt-in', () => {
      expect(
        validateConsentDates({ optInDate: pastDate, optOutDate: laterDate }),
      ).toBe(true);
    });

    it('should fail when opt-out is before opt-in', () => {
      expect(
        validateConsentDates({ optInDate: laterDate, optOutDate: pastDate }),
      ).toBe(false);
    });

    it('should fail when opt-out equals opt-in', () => {
      expect(
        validateConsentDates({ optInDate: pastDate, optOutDate: pastDate }),
      ).toBe(false);
    });

    it('should validate with only opt-in date', () => {
      expect(validateConsentDates({ optInDate: pastDate })).toBe(true);
    });

    it('should validate with only opt-out date', () => {
      expect(validateConsentDates({ optOutDate: pastDate })).toBe(true);
    });
  });

  describe('Created and updated date consistency', () => {
    it('should validate when updated is after created', () => {
      expect(
        validateConsentDates({ createdAt: pastDate, updatedAt: laterDate }),
      ).toBe(true);
    });

    it('should fail when updated is before created', () => {
      expect(
        validateConsentDates({ createdAt: laterDate, updatedAt: pastDate }),
      ).toBe(false);
    });

    it('should validate when updated equals created', () => {
      expect(
        validateConsentDates({ createdAt: pastDate, updatedAt: pastDate }),
      ).toBe(true);
    });
  });

  describe('Future date validation', () => {
    it('should fail when opt-in date is in the future', () => {
      expect(validateConsentDates({ optInDate: futureDate })).toBe(false);
    });

    it('should fail when opt-out date is in the future', () => {
      expect(validateConsentDates({ optOutDate: futureDate })).toBe(false);
    });
  });

  describe('No dates provided', () => {
    it('should validate empty dates object', () => {
      expect(validateConsentDates({})).toBe(true);
    });

    it('should validate null dates', () => {
      expect(validateConsentDates({ optInDate: null, optOutDate: null })).toBe(
        true,
      );
    });
  });
});

describe('validateConsentTransition', () => {
  it('should validate all valid transitions from UNKNOWN', () => {
    expect(
      validateConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.PENDING),
    ).toBe(true);
    expect(
      validateConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.OPTED_IN),
    ).toBe(true);
    expect(
      validateConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.OPTED_OUT),
    ).toBe(true);
  });

  it('should validate all valid transitions from PENDING', () => {
    expect(
      validateConsentTransition(ConsentStatus.PENDING, ConsentStatus.OPTED_IN),
    ).toBe(true);
    expect(
      validateConsentTransition(ConsentStatus.PENDING, ConsentStatus.OPTED_OUT),
    ).toBe(true);
  });

  it('should validate transition from OPTED_IN to OPTED_OUT', () => {
    expect(
      validateConsentTransition(
        ConsentStatus.OPTED_IN,
        ConsentStatus.OPTED_OUT,
      ),
    ).toBe(true);
  });

  it('should validate transition from OPTED_OUT to OPTED_IN', () => {
    expect(
      validateConsentTransition(
        ConsentStatus.OPTED_OUT,
        ConsentStatus.OPTED_IN,
      ),
    ).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(
      validateConsentTransition(ConsentStatus.OPTED_IN, ConsentStatus.UNKNOWN),
    ).toBe(false);
    expect(
      validateConsentTransition(ConsentStatus.OPTED_IN, ConsentStatus.PENDING),
    ).toBe(false);
    expect(
      validateConsentTransition(ConsentStatus.OPTED_OUT, ConsentStatus.UNKNOWN),
    ).toBe(false);
    expect(
      validateConsentTransition(ConsentStatus.OPTED_OUT, ConsentStatus.PENDING),
    ).toBe(false);
  });

  it('should reject same-status transitions', () => {
    expect(
      validateConsentTransition(ConsentStatus.OPTED_IN, ConsentStatus.OPTED_IN),
    ).toBe(false);
    expect(
      validateConsentTransition(
        ConsentStatus.OPTED_OUT,
        ConsentStatus.OPTED_OUT,
      ),
    ).toBe(false);
    expect(
      validateConsentTransition(ConsentStatus.PENDING, ConsentStatus.PENDING),
    ).toBe(false);
    expect(
      validateConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.UNKNOWN),
    ).toBe(false);
  });
});

describe('validateConsentRecord', () => {
  const validRecord: ConsentRecord = {
    phoneNumber: '+12125551234',
    status: ConsentStatus.OPTED_IN,
    source: ConsentSource.WEB_FORM,
    type: ConsentType.MARKETING,
    verificationMethod: ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN,
    legalBasis: LegalBasis.CONSENT,
    optInDate: new Date('2023-01-01'),
    optOutDate: null,
    metadata: {
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1',
      timestamp: '2023-01-01T00:00:00Z',
    },
    contactId: 'contact-123',
  };

  describe('Valid records', () => {
    it('should validate a complete valid record', () => {
      const result = validateConsentRecord(validRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a minimal valid record', () => {
      const minimalRecord: ConsentRecord = {
        phoneNumber: '+12125551234',
        status: ConsentStatus.OPTED_IN,
        source: ConsentSource.WEB_FORM,
        optInDate: new Date('2023-01-01'),
      };
      const result = validateConsentRecord(minimalRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid records', () => {
    it('should fail with missing phone number', () => {
      const record = { ...validRecord, phoneNumber: '' };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number is required');
    });

    it('should fail with invalid phone number format', () => {
      const record = { ...validRecord, phoneNumber: '123' };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number format is invalid');
    });

    it('should fail with missing status', () => {
      const record = { ...validRecord, status: '' as any };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Consent status is required');
    });

    it('should fail with invalid status', () => {
      const record = { ...validRecord, status: 'INVALID_STATUS' as any };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid consent status');
    });

    it('should fail with missing source', () => {
      const record = { ...validRecord, source: '' as any };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Consent source is required');
    });

    it('should fail with invalid source', () => {
      const record = { ...validRecord, source: 'INVALID_SOURCE' as any };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid consent source');
    });

    it('should fail with invalid optional enums', () => {
      const record = {
        ...validRecord,
        type: 'INVALID_TYPE' as any,
        verificationMethod: 'INVALID_METHOD' as any,
        legalBasis: 'INVALID_BASIS' as any,
      };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid consent type');
      expect(result.errors).toContain('Invalid verification method');
      expect(result.errors).toContain('Invalid legal basis');
    });

    it('should fail with inconsistent dates', () => {
      const record = {
        ...validRecord,
        optInDate: new Date('2023-06-01'),
        optOutDate: new Date('2023-01-01'),
      };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Consent dates are inconsistent');
    });

    it('should fail with status-date inconsistency', () => {
      const record = {
        ...validRecord,
        status: ConsentStatus.OPTED_IN,
        optInDate: null,
      };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Consent status OPTED_IN is inconsistent with provided dates',
      );
    });

    it('should fail with invalid metadata', () => {
      const record = { ...validRecord, metadata: 'invalid' as any };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Metadata must be a valid object');
    });

    it('should fail with invalid contact ID', () => {
      const record = { ...validRecord, contactId: '' };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact ID must be a non-empty string');
    });
  });

  describe('Warnings', () => {
    it('should warn for opted-in consent without verification method', () => {
      const record = {
        ...validRecord,
        status: ConsentStatus.OPTED_IN,
        verificationMethod: undefined,
      };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Verification method recommended for opted-in consent',
      );
    });

    it('should warn for unknown consent source', () => {
      const record = { ...validRecord, source: ConsentSource.UNKNOWN };
      const result = validateConsentRecord(record);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Consent source should be specified for better compliance',
      );
    });
  });
});

describe('validateConsentMetadata', () => {
  it('should validate metadata with required fields', () => {
    const validMetadata = {
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1',
      timestamp: '2023-01-01T00:00:00Z',
    };
    expect(validateConsentMetadata(validMetadata)).toBe(true);
  });

  it('should validate metadata with some required fields', () => {
    expect(validateConsentMetadata({ userAgent: 'Mozilla/5.0' })).toBe(true);
    expect(validateConsentMetadata({ ipAddress: '192.168.1.1' })).toBe(true);
    expect(validateConsentMetadata({ timestamp: '2023-01-01T00:00:00Z' })).toBe(
      true,
    );
  });

  it('should fail with no required fields', () => {
    expect(validateConsentMetadata({ customField: 'value' })).toBe(false);
  });

  it('should fail with invalid metadata types', () => {
    expect(validateConsentMetadata(null as any)).toBe(false);
    expect(validateConsentMetadata(undefined as any)).toBe(false);
    expect(validateConsentMetadata('string' as any)).toBe(false);
    expect(validateConsentMetadata([] as any)).toBe(false);
  });

  it('should fail with empty metadata', () => {
    expect(validateConsentMetadata({})).toBe(false);
  });
});

describe('getValidConsentTransitions', () => {
  it('should return valid transitions for each status', () => {
    expect(getValidConsentTransitions(ConsentStatus.UNKNOWN)).toEqual([
      ConsentStatus.PENDING,
      ConsentStatus.OPTED_IN,
      ConsentStatus.OPTED_OUT,
    ]);
    expect(getValidConsentTransitions(ConsentStatus.PENDING)).toEqual([
      ConsentStatus.OPTED_IN,
      ConsentStatus.OPTED_OUT,
    ]);
    expect(getValidConsentTransitions(ConsentStatus.OPTED_IN)).toEqual([
      ConsentStatus.OPTED_OUT,
    ]);
    expect(getValidConsentTransitions(ConsentStatus.OPTED_OUT)).toEqual([
      ConsentStatus.OPTED_IN,
    ]);
  });
});

describe('isConsentExpired', () => {
  const eighteenMonthsAgo = new Date();
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  it('should return false for null opt-in date', () => {
    expect(isConsentExpired(null)).toBe(false);
  });

  it('should return false for recent opt-in date', () => {
    expect(isConsentExpired(sixMonthsAgo)).toBe(false);
  });

  it('should return true for old opt-in date (18+ months)', () => {
    const twentyMonthsAgo = new Date();
    twentyMonthsAgo.setMonth(twentyMonthsAgo.getMonth() - 20);
    expect(isConsentExpired(twentyMonthsAgo)).toBe(true);
  });

  it('should use explicit expiry date from metadata', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(
      isConsentExpired(sixMonthsAgo, { expiryDate: yesterday.toISOString() }),
    ).toBe(true);
    expect(
      isConsentExpired(sixMonthsAgo, { expiryDate: tomorrow.toISOString() }),
    ).toBe(false);
  });
});

describe('consentValidator object', () => {
  it('should export all validation functions', () => {
    expect(typeof consentValidator.validateConsentStatus).toBe('function');
    expect(typeof consentValidator.validatePhoneNumber).toBe('function');
    expect(typeof consentValidator.validateConsentSource).toBe('function');
    expect(typeof consentValidator.validateConsentDates).toBe('function');
    expect(typeof consentValidator.validateConsentTransition).toBe('function');
    expect(typeof consentValidator.validateConsentRecord).toBe('function');
    expect(typeof consentValidator.validateConsentMetadata).toBe('function');
    expect(typeof consentValidator.getValidConsentTransitions).toBe('function');
    expect(typeof consentValidator.isConsentExpired).toBe('function');
  });

  it('should have consistent behavior with individual functions', () => {
    expect(consentValidator.validatePhoneNumber('+1234567890')).toBe(
      validatePhoneNumber('+1234567890'),
    );
    expect(consentValidator.validateConsentSource(ConsentSource.WEB_FORM)).toBe(
      validateConsentSource(ConsentSource.WEB_FORM),
    );
    expect(consentValidator.isConsentExpired(new Date())).toBe(
      isConsentExpired(new Date()),
    );
  });
});

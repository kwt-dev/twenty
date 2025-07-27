/**
 * @fileoverview Unit tests for consent enums and type guards
 * Tests all consent-related enums, type guards, and transition validation
 */

import {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
  isConsentStatus,
  isConsentSource,
  isConsentType,
  isConsentVerificationMethod,
  isLegalBasis,
  isValidConsentTransition,
  VALID_CONSENT_TRANSITIONS,
  CONSENT_ENUMS,
} from '../types/consent-enums';

describe('ConsentStatus enum', () => {
  it('should have correct values', () => {
    expect(ConsentStatus.OPTED_IN).toBe('OPTED_IN');
    expect(ConsentStatus.OPTED_OUT).toBe('OPTED_OUT');
    expect(ConsentStatus.PENDING).toBe('PENDING');
    expect(ConsentStatus.UNKNOWN).toBe('UNKNOWN');
  });

  it('should have all expected values', () => {
    const values = Object.values(ConsentStatus);
    expect(values).toHaveLength(4);
    expect(values).toContain('OPTED_IN');
    expect(values).toContain('OPTED_OUT');
    expect(values).toContain('PENDING');
    expect(values).toContain('UNKNOWN');
  });
});

describe('ConsentSource enum', () => {
  it('should have correct values', () => {
    expect(ConsentSource.WEB_FORM).toBe('WEB_FORM');
    expect(ConsentSource.SMS_KEYWORD).toBe('SMS_KEYWORD');
    expect(ConsentSource.API).toBe('API');
    expect(ConsentSource.PHONE_CALL).toBe('PHONE_CALL');
    expect(ConsentSource.EMAIL).toBe('EMAIL');
    expect(ConsentSource.MOBILE_APP).toBe('MOBILE_APP');
    expect(ConsentSource.INTEGRATION).toBe('INTEGRATION');
    expect(ConsentSource.MANUAL).toBe('MANUAL');
    expect(ConsentSource.UNKNOWN).toBe('UNKNOWN');
  });

  it('should have all expected values', () => {
    const values = Object.values(ConsentSource);
    expect(values).toHaveLength(9);
    expect(values).toContain('WEB_FORM');
    expect(values).toContain('SMS_KEYWORD');
    expect(values).toContain('API');
    expect(values).toContain('PHONE_CALL');
    expect(values).toContain('EMAIL');
    expect(values).toContain('MOBILE_APP');
    expect(values).toContain('INTEGRATION');
    expect(values).toContain('MANUAL');
    expect(values).toContain('UNKNOWN');
  });
});

describe('ConsentType enum', () => {
  it('should have correct values', () => {
    expect(ConsentType.MARKETING).toBe('MARKETING');
    expect(ConsentType.TRANSACTIONAL).toBe('TRANSACTIONAL');
    expect(ConsentType.INFORMATIONAL).toBe('INFORMATIONAL');
    expect(ConsentType.EMERGENCY).toBe('EMERGENCY');
    expect(ConsentType.SERVICE).toBe('SERVICE');
    expect(ConsentType.ALL).toBe('ALL');
  });

  it('should have all expected values', () => {
    const values = Object.values(ConsentType);
    expect(values).toHaveLength(6);
    expect(values).toContain('MARKETING');
    expect(values).toContain('TRANSACTIONAL');
    expect(values).toContain('INFORMATIONAL');
    expect(values).toContain('EMERGENCY');
    expect(values).toContain('SERVICE');
    expect(values).toContain('ALL');
  });
});

describe('ConsentVerificationMethod enum', () => {
  it('should have correct values', () => {
    expect(ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN).toBe(
      'EMAIL_DOUBLE_OPTIN',
    );
    expect(ConsentVerificationMethod.SMS_KEYWORD_CONFIRMATION).toBe(
      'SMS_KEYWORD_CONFIRMATION',
    );
    expect(ConsentVerificationMethod.PHONE_VERIFICATION).toBe(
      'PHONE_VERIFICATION',
    );
    expect(ConsentVerificationMethod.MANUAL_VERIFICATION).toBe(
      'MANUAL_VERIFICATION',
    );
    expect(ConsentVerificationMethod.API_VERIFICATION).toBe('API_VERIFICATION');
    expect(ConsentVerificationMethod.NONE).toBe('NONE');
  });

  it('should have all expected values', () => {
    const values = Object.values(ConsentVerificationMethod);
    expect(values).toHaveLength(6);
    expect(values).toContain('EMAIL_DOUBLE_OPTIN');
    expect(values).toContain('SMS_KEYWORD_CONFIRMATION');
    expect(values).toContain('PHONE_VERIFICATION');
    expect(values).toContain('MANUAL_VERIFICATION');
    expect(values).toContain('API_VERIFICATION');
    expect(values).toContain('NONE');
  });
});

describe('LegalBasis enum', () => {
  it('should have correct values', () => {
    expect(LegalBasis.CONSENT).toBe('CONSENT');
    expect(LegalBasis.CONTRACT).toBe('CONTRACT');
    expect(LegalBasis.LEGAL_OBLIGATION).toBe('LEGAL_OBLIGATION');
    expect(LegalBasis.VITAL_INTERESTS).toBe('VITAL_INTERESTS');
    expect(LegalBasis.PUBLIC_TASK).toBe('PUBLIC_TASK');
    expect(LegalBasis.LEGITIMATE_INTERESTS).toBe('LEGITIMATE_INTERESTS');
  });

  it('should have all expected values', () => {
    const values = Object.values(LegalBasis);
    expect(values).toHaveLength(6);
    expect(values).toContain('CONSENT');
    expect(values).toContain('CONTRACT');
    expect(values).toContain('LEGAL_OBLIGATION');
    expect(values).toContain('VITAL_INTERESTS');
    expect(values).toContain('PUBLIC_TASK');
    expect(values).toContain('LEGITIMATE_INTERESTS');
  });
});

describe('Type guard functions', () => {
  describe('isConsentStatus', () => {
    it('should return true for valid consent status values', () => {
      expect(isConsentStatus('OPTED_IN')).toBe(true);
      expect(isConsentStatus('OPTED_OUT')).toBe(true);
      expect(isConsentStatus('PENDING')).toBe(true);
      expect(isConsentStatus('UNKNOWN')).toBe(true);
    });

    it('should return false for invalid consent status values', () => {
      expect(isConsentStatus('INVALID')).toBe(false);
      expect(isConsentStatus('')).toBe(false);
      expect(isConsentStatus('opted_in')).toBe(false);
      expect(isConsentStatus('OPTED IN')).toBe(false);
    });
  });

  describe('isConsentSource', () => {
    it('should return true for valid consent source values', () => {
      expect(isConsentSource('WEB_FORM')).toBe(true);
      expect(isConsentSource('SMS_KEYWORD')).toBe(true);
      expect(isConsentSource('API')).toBe(true);
      expect(isConsentSource('PHONE_CALL')).toBe(true);
      expect(isConsentSource('EMAIL')).toBe(true);
      expect(isConsentSource('MOBILE_APP')).toBe(true);
      expect(isConsentSource('INTEGRATION')).toBe(true);
      expect(isConsentSource('MANUAL')).toBe(true);
      expect(isConsentSource('UNKNOWN')).toBe(true);
    });

    it('should return false for invalid consent source values', () => {
      expect(isConsentSource('INVALID')).toBe(false);
      expect(isConsentSource('')).toBe(false);
      expect(isConsentSource('web_form')).toBe(false);
      expect(isConsentSource('WEB FORM')).toBe(false);
    });
  });

  describe('isConsentType', () => {
    it('should return true for valid consent type values', () => {
      expect(isConsentType('MARKETING')).toBe(true);
      expect(isConsentType('TRANSACTIONAL')).toBe(true);
      expect(isConsentType('INFORMATIONAL')).toBe(true);
      expect(isConsentType('EMERGENCY')).toBe(true);
      expect(isConsentType('SERVICE')).toBe(true);
      expect(isConsentType('ALL')).toBe(true);
    });

    it('should return false for invalid consent type values', () => {
      expect(isConsentType('INVALID')).toBe(false);
      expect(isConsentType('')).toBe(false);
      expect(isConsentType('marketing')).toBe(false);
      expect(isConsentType('MARKETING_MESSAGES')).toBe(false);
    });
  });

  describe('isConsentVerificationMethod', () => {
    it('should return true for valid verification method values', () => {
      expect(isConsentVerificationMethod('EMAIL_DOUBLE_OPTIN')).toBe(true);
      expect(isConsentVerificationMethod('SMS_KEYWORD_CONFIRMATION')).toBe(
        true,
      );
      expect(isConsentVerificationMethod('PHONE_VERIFICATION')).toBe(true);
      expect(isConsentVerificationMethod('MANUAL_VERIFICATION')).toBe(true);
      expect(isConsentVerificationMethod('API_VERIFICATION')).toBe(true);
      expect(isConsentVerificationMethod('NONE')).toBe(true);
    });

    it('should return false for invalid verification method values', () => {
      expect(isConsentVerificationMethod('INVALID')).toBe(false);
      expect(isConsentVerificationMethod('')).toBe(false);
      expect(isConsentVerificationMethod('email_double_optin')).toBe(false);
      expect(isConsentVerificationMethod('EMAIL DOUBLE OPTIN')).toBe(false);
    });
  });

  describe('isLegalBasis', () => {
    it('should return true for valid legal basis values', () => {
      expect(isLegalBasis('CONSENT')).toBe(true);
      expect(isLegalBasis('CONTRACT')).toBe(true);
      expect(isLegalBasis('LEGAL_OBLIGATION')).toBe(true);
      expect(isLegalBasis('VITAL_INTERESTS')).toBe(true);
      expect(isLegalBasis('PUBLIC_TASK')).toBe(true);
      expect(isLegalBasis('LEGITIMATE_INTERESTS')).toBe(true);
    });

    it('should return false for invalid legal basis values', () => {
      expect(isLegalBasis('INVALID')).toBe(false);
      expect(isLegalBasis('')).toBe(false);
      expect(isLegalBasis('consent')).toBe(false);
      expect(isLegalBasis('LEGAL OBLIGATION')).toBe(false);
    });
  });
});

describe('Consent transition validation', () => {
  describe('VALID_CONSENT_TRANSITIONS', () => {
    it('should have correct transition mappings', () => {
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.UNKNOWN]).toEqual([
        ConsentStatus.PENDING,
        ConsentStatus.OPTED_IN,
        ConsentStatus.OPTED_OUT,
      ]);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.PENDING]).toEqual([
        ConsentStatus.OPTED_IN,
        ConsentStatus.OPTED_OUT,
      ]);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_IN]).toEqual([
        ConsentStatus.OPTED_OUT,
      ]);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_OUT]).toEqual([
        ConsentStatus.OPTED_IN,
      ]);
    });

    it('should allow all transitions from UNKNOWN', () => {
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.UNKNOWN]).toHaveLength(3);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.UNKNOWN]).toContain(
        ConsentStatus.PENDING,
      );
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.UNKNOWN]).toContain(
        ConsentStatus.OPTED_IN,
      );
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.UNKNOWN]).toContain(
        ConsentStatus.OPTED_OUT,
      );
    });

    it('should allow opt-in and opt-out from PENDING', () => {
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.PENDING]).toHaveLength(2);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.PENDING]).toContain(
        ConsentStatus.OPTED_IN,
      );
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.PENDING]).toContain(
        ConsentStatus.OPTED_OUT,
      );
    });

    it('should allow only opt-out from OPTED_IN', () => {
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_IN]).toHaveLength(1);
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_IN]).toContain(
        ConsentStatus.OPTED_OUT,
      );
    });

    it('should allow only opt-in from OPTED_OUT', () => {
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_OUT]).toHaveLength(
        1,
      );
      expect(VALID_CONSENT_TRANSITIONS[ConsentStatus.OPTED_OUT]).toContain(
        ConsentStatus.OPTED_IN,
      );
    });
  });

  describe('isValidConsentTransition', () => {
    it('should validate transitions from UNKNOWN', () => {
      expect(
        isValidConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.PENDING),
      ).toBe(true);
      expect(
        isValidConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.OPTED_IN),
      ).toBe(true);
      expect(
        isValidConsentTransition(
          ConsentStatus.UNKNOWN,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);
      expect(
        isValidConsentTransition(ConsentStatus.UNKNOWN, ConsentStatus.UNKNOWN),
      ).toBe(false);
    });

    it('should validate transitions from PENDING', () => {
      expect(
        isValidConsentTransition(ConsentStatus.PENDING, ConsentStatus.OPTED_IN),
      ).toBe(true);
      expect(
        isValidConsentTransition(
          ConsentStatus.PENDING,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);
      expect(
        isValidConsentTransition(ConsentStatus.PENDING, ConsentStatus.UNKNOWN),
      ).toBe(false);
      expect(
        isValidConsentTransition(ConsentStatus.PENDING, ConsentStatus.PENDING),
      ).toBe(false);
    });

    it('should validate transitions from OPTED_IN', () => {
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);
      expect(
        isValidConsentTransition(ConsentStatus.OPTED_IN, ConsentStatus.UNKNOWN),
      ).toBe(false);
      expect(
        isValidConsentTransition(ConsentStatus.OPTED_IN, ConsentStatus.PENDING),
      ).toBe(false);
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(false);
    });

    it('should validate transitions from OPTED_OUT', () => {
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(true);
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.UNKNOWN,
        ),
      ).toBe(false);
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.PENDING,
        ),
      ).toBe(false);
      expect(
        isValidConsentTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(false);
    });
  });
});

describe('CONSENT_ENUMS export', () => {
  it('should export all consent enums', () => {
    expect(CONSENT_ENUMS.ConsentStatus).toBe(ConsentStatus);
    expect(CONSENT_ENUMS.ConsentSource).toBe(ConsentSource);
    expect(CONSENT_ENUMS.ConsentType).toBe(ConsentType);
    expect(CONSENT_ENUMS.ConsentVerificationMethod).toBe(
      ConsentVerificationMethod,
    );
    expect(CONSENT_ENUMS.LegalBasis).toBe(LegalBasis);
  });

  it('should have all expected enum keys', () => {
    const keys = Object.keys(CONSENT_ENUMS);
    expect(keys).toHaveLength(5);
    expect(keys).toContain('ConsentStatus');
    expect(keys).toContain('ConsentSource');
    expect(keys).toContain('ConsentType');
    expect(keys).toContain('ConsentVerificationMethod');
    expect(keys).toContain('LegalBasis');
  });
});

describe('Enum value consistency', () => {
  it('should have consistent enum values between individual enums and CONSENT_ENUMS', () => {
    expect(Object.values(CONSENT_ENUMS.ConsentStatus)).toEqual(
      Object.values(ConsentStatus),
    );
    expect(Object.values(CONSENT_ENUMS.ConsentSource)).toEqual(
      Object.values(ConsentSource),
    );
    expect(Object.values(CONSENT_ENUMS.ConsentType)).toEqual(
      Object.values(ConsentType),
    );
    expect(Object.values(CONSENT_ENUMS.ConsentVerificationMethod)).toEqual(
      Object.values(ConsentVerificationMethod),
    );
    expect(Object.values(CONSENT_ENUMS.LegalBasis)).toEqual(
      Object.values(LegalBasis),
    );
  });
});

describe('Edge cases and error handling', () => {
  it('should handle null and undefined values in type guards', () => {
    expect(isConsentStatus(null as any)).toBe(false);
    expect(isConsentStatus(undefined as any)).toBe(false);
    expect(isConsentSource(null as any)).toBe(false);
    expect(isConsentSource(undefined as any)).toBe(false);
    expect(isConsentType(null as any)).toBe(false);
    expect(isConsentType(undefined as any)).toBe(false);
    expect(isConsentVerificationMethod(null as any)).toBe(false);
    expect(isConsentVerificationMethod(undefined as any)).toBe(false);
    expect(isLegalBasis(null as any)).toBe(false);
    expect(isLegalBasis(undefined as any)).toBe(false);
  });

  it('should handle number values in type guards', () => {
    expect(isConsentStatus(1 as any)).toBe(false);
    expect(isConsentSource(2 as any)).toBe(false);
    expect(isConsentType(3 as any)).toBe(false);
    expect(isConsentVerificationMethod(4 as any)).toBe(false);
    expect(isLegalBasis(5 as any)).toBe(false);
  });

  it('should handle object values in type guards', () => {
    expect(isConsentStatus({} as any)).toBe(false);
    expect(isConsentSource({} as any)).toBe(false);
    expect(isConsentType({} as any)).toBe(false);
    expect(isConsentVerificationMethod({} as any)).toBe(false);
    expect(isLegalBasis({} as any)).toBe(false);
  });
});

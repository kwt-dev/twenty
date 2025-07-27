/**
 * @fileoverview Unit tests for TribConsent WorkspaceEntity
 * Tests entity structure, validation methods, and TCPA compliance features
 */

import { TribConsentWorkspaceEntity } from '../standard-objects/trib-consent.workspace-entity';
import {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
} from '../types/consent-enums';

describe('TribConsentWorkspaceEntity', () => {
  describe('Entity instantiation', () => {
    it('should create a new TribConsent entity', () => {
      const consent = new TribConsentWorkspaceEntity();
      expect(consent).toBeInstanceOf(TribConsentWorkspaceEntity);
      expect(consent.id).toBeUndefined();
      expect(consent.phoneNumber).toBeUndefined();
      expect(consent.status).toBeUndefined();
      expect(consent.source).toBeUndefined();
    });

    it('should allow setting all required fields', () => {
      const consent = new TribConsentWorkspaceEntity();
      consent.phoneNumber = '+12125551234'; // Valid US phone number
      consent.status = ConsentStatus.OPTED_IN;
      consent.source = ConsentSource.WEB_FORM;
      consent.optInDate = new Date('2023-01-01');

      expect(consent.phoneNumber).toBe('+12125551234');
      expect(consent.status).toBe(ConsentStatus.OPTED_IN);
      expect(consent.source).toBe(ConsentSource.WEB_FORM);
      expect(consent.optInDate).toEqual(new Date('2023-01-01'));
    });

    it('should allow setting all optional fields', () => {
      const consent = new TribConsentWorkspaceEntity();
      const optInDate = new Date('2023-01-01');
      const optOutDate = new Date('2023-06-01');
      const metadata = { userAgent: 'Mozilla/5.0', ipAddress: '192.168.1.1' };
      const auditTrail = [
        {
          action: 'opt-in',
          timestamp: optInDate,
          source: ConsentSource.WEB_FORM,
        },
      ];

      consent.type = ConsentType.MARKETING;
      consent.verificationMethod = ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN;
      consent.legalBasis = LegalBasis.CONSENT;
      consent.version = 1;
      consent.verified = true;
      consent.metadata = metadata;
      consent.auditTrail = auditTrail;
      consent.contactId = 'contact-123';

      expect(consent.type).toBe(ConsentType.MARKETING);
      expect(consent.verificationMethod).toBe(
        ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN,
      );
      expect(consent.legalBasis).toBe(LegalBasis.CONSENT);
      expect(consent.version).toBe(1);
      expect(consent.verified).toBe(true);
      expect(consent.metadata).toBe(metadata);
      expect(consent.auditTrail).toBe(auditTrail);
      expect(consent.contactId).toBe('contact-123');
    });
  });

  describe('Static validation methods', () => {
    describe('validateConsent', () => {
      it('should validate a complete valid consent record', () => {
        const validRecord = {
          phoneNumber: '+12125551234', // Valid US phone number
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

        const result = TribConsentWorkspaceEntity.validateConsent(validRecord);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a minimal valid consent record', () => {
        const minimalRecord = {
          phoneNumber: '+12125551234', // Valid US phone number
          status: ConsentStatus.OPTED_IN,
          source: ConsentSource.WEB_FORM,
          optInDate: new Date('2023-01-01'),
        };

        const result =
          TribConsentWorkspaceEntity.validateConsent(minimalRecord);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation for invalid consent record', () => {
        const invalidRecord = {
          phoneNumber: '123', // Invalid phone number
          status: ConsentStatus.OPTED_IN,
          source: ConsentSource.WEB_FORM,
          optInDate: null, // Missing required opt-in date for OPTED_IN status
        };

        const result =
          TribConsentWorkspaceEntity.validateConsent(invalidRecord);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle empty record', () => {
        const result = TribConsentWorkspaceEntity.validateConsent({});
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Phone number is required');
        // Note: The validator may not check other fields if phone number is missing
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validatePhoneNumber', () => {
      it('should validate E.164 format phone numbers', () => {
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+1234567890'),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+12345678901'),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+123456789012'),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+1234567890123'),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+12345678901234'),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+123456789012345'),
        ).toBe(true);
      });

      it('should reject invalid E.164 format', () => {
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('1234567890'),
        ).toBe(false); // Missing +
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+0123456789'),
        ).toBe(false); // Starts with 0
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber('+12345678901234567'),
        ).toBe(false); // Too long
        expect(TribConsentWorkspaceEntity.validatePhoneNumber('+1')).toBe(
          false,
        ); // Too short (minimum 2 digits)
        expect(TribConsentWorkspaceEntity.validatePhoneNumber('')).toBe(false); // Empty
        expect(
          TribConsentWorkspaceEntity.validatePhoneNumber(null as any),
        ).toBe(false); // Null
      });
    });

    describe('validateStatusTransition', () => {
      it('should validate all valid status transitions', () => {
        // From UNKNOWN
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.UNKNOWN,
            ConsentStatus.PENDING,
          ),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.UNKNOWN,
            ConsentStatus.OPTED_IN,
          ),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.UNKNOWN,
            ConsentStatus.OPTED_OUT,
          ),
        ).toBe(true);

        // From PENDING
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.PENDING,
            ConsentStatus.OPTED_IN,
          ),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.PENDING,
            ConsentStatus.OPTED_OUT,
          ),
        ).toBe(true);

        // From OPTED_IN
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_IN,
            ConsentStatus.OPTED_OUT,
          ),
        ).toBe(true);

        // From OPTED_OUT
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_OUT,
            ConsentStatus.OPTED_IN,
          ),
        ).toBe(true);
      });

      it('should reject invalid status transitions', () => {
        // Invalid from OPTED_IN
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_IN,
            ConsentStatus.UNKNOWN,
          ),
        ).toBe(false);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_IN,
            ConsentStatus.PENDING,
          ),
        ).toBe(false);

        // Invalid from OPTED_OUT
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_OUT,
            ConsentStatus.UNKNOWN,
          ),
        ).toBe(false);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_OUT,
            ConsentStatus.PENDING,
          ),
        ).toBe(false);

        // Same status transitions
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_IN,
            ConsentStatus.OPTED_IN,
          ),
        ).toBe(false);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.OPTED_OUT,
            ConsentStatus.OPTED_OUT,
          ),
        ).toBe(false);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.PENDING,
            ConsentStatus.PENDING,
          ),
        ).toBe(false);
        expect(
          TribConsentWorkspaceEntity.validateStatusTransition(
            ConsentStatus.UNKNOWN,
            ConsentStatus.UNKNOWN,
          ),
        ).toBe(false);
      });
    });

    describe('validateConsentDates', () => {
      it('should validate consistent dates', () => {
        const optInDate = new Date('2023-01-01');
        const optOutDate = new Date('2023-06-01');

        expect(
          TribConsentWorkspaceEntity.validateConsentDates(
            optInDate,
            optOutDate,
          ),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateConsentDates(optInDate, null),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateConsentDates(null, optOutDate),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.validateConsentDates(null, null),
        ).toBe(true);
      });

      it('should reject inconsistent dates', () => {
        const optInDate = new Date('2023-06-01');
        const optOutDate = new Date('2023-01-01');

        expect(
          TribConsentWorkspaceEntity.validateConsentDates(
            optInDate,
            optOutDate,
          ),
        ).toBe(false);

        // Same dates should also fail
        expect(
          TribConsentWorkspaceEntity.validateConsentDates(optInDate, optInDate),
        ).toBe(false);
      });
    });

    describe('isConsentExpired', () => {
      it('should return false for null opt-in date', () => {
        expect(TribConsentWorkspaceEntity.isConsentExpired(null)).toBe(false);
      });

      it('should return false for recent opt-in date', () => {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 6);
        expect(TribConsentWorkspaceEntity.isConsentExpired(recentDate)).toBe(
          false,
        );
      });

      it('should return true for old opt-in date', () => {
        const oldDate = new Date();
        oldDate.setMonth(oldDate.getMonth() - 20);
        expect(TribConsentWorkspaceEntity.isConsentExpired(oldDate)).toBe(true);
      });

      it('should use explicit expiry date from metadata', () => {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 6);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        expect(
          TribConsentWorkspaceEntity.isConsentExpired(recentDate, {
            expiryDate: yesterday,
          }),
        ).toBe(true);
        expect(
          TribConsentWorkspaceEntity.isConsentExpired(recentDate, {
            expiryDate: tomorrow,
          }),
        ).toBe(false);
      });
    });

    describe('createAuditEntry', () => {
      it('should create a valid audit entry', () => {
        const metadata = { userAgent: 'Mozilla/5.0', ipAddress: '192.168.1.1' };
        const entry = TribConsentWorkspaceEntity.createAuditEntry(
          'opt-in',
          ConsentSource.WEB_FORM,
          metadata,
        );

        expect(entry.action).toBe('opt-in');
        expect(entry.source).toBe(ConsentSource.WEB_FORM);
        expect(entry.metadata).toBe(metadata);
        expect(entry.timestamp).toBeInstanceOf(Date);
      });

      it('should create audit entry without metadata', () => {
        const entry = TribConsentWorkspaceEntity.createAuditEntry(
          'opt-out',
          ConsentSource.SMS_KEYWORD,
        );

        expect(entry.action).toBe('opt-out');
        expect(entry.source).toBe(ConsentSource.SMS_KEYWORD);
        expect(entry.metadata).toBeUndefined();
        expect(entry.timestamp).toBeInstanceOf(Date);
      });
    });

    describe('allowsMarketing', () => {
      it('should allow marketing for valid opted-in consent', () => {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 6);

        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_IN,
            ConsentType.MARKETING,
            recentDate,
          ),
        ).toBe(true);

        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_IN,
            ConsentType.ALL,
            recentDate,
          ),
        ).toBe(true);
      });

      it('should not allow marketing for opted-out consent', () => {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 6);

        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_OUT,
            ConsentType.MARKETING,
            recentDate,
          ),
        ).toBe(false);
      });

      it('should not allow marketing for wrong consent type', () => {
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 6);

        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_IN,
            ConsentType.TRANSACTIONAL,
            recentDate,
          ),
        ).toBe(false);
      });

      it('should not allow marketing for expired consent', () => {
        const oldDate = new Date();
        oldDate.setMonth(oldDate.getMonth() - 20);

        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_IN,
            ConsentType.MARKETING,
            oldDate,
          ),
        ).toBe(false);
      });

      it('should allow marketing without opt-in date (current implementation)', () => {
        // Current implementation: isConsentExpired(null) returns false, so marketing is allowed
        expect(
          TribConsentWorkspaceEntity.allowsMarketing(
            ConsentStatus.OPTED_IN,
            ConsentType.MARKETING,
            null,
          ),
        ).toBe(true);
      });
    });

    describe('allowsTransactional', () => {
      it('should allow transactional messages for appropriate consent types', () => {
        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.OPTED_IN,
            ConsentType.TRANSACTIONAL,
          ),
        ).toBe(true);

        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.OPTED_IN,
            ConsentType.ALL,
          ),
        ).toBe(true);

        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.OPTED_IN,
            ConsentType.SERVICE,
          ),
        ).toBe(true);
      });

      it('should allow transactional messages for pending/unknown status', () => {
        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.PENDING,
            ConsentType.TRANSACTIONAL,
          ),
        ).toBe(true);

        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.UNKNOWN,
            ConsentType.TRANSACTIONAL,
          ),
        ).toBe(true);
      });

      it('should not allow transactional messages for opted-out consent', () => {
        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.OPTED_OUT,
            ConsentType.TRANSACTIONAL,
          ),
        ).toBe(false);
      });

      it('should not allow transactional messages for marketing-only consent', () => {
        expect(
          TribConsentWorkspaceEntity.allowsTransactional(
            ConsentStatus.OPTED_IN,
            ConsentType.MARKETING,
          ),
        ).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate E.164 format phone numbers with simple regex', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '+12345678901',
        '+123456789012',
        '+1234567890123',
        '+12345678901234',
        '+123456789012345', // Max length
      ];

      validPhoneNumbers.forEach((phone) => {
        expect(TribConsentWorkspaceEntity.validatePhoneNumber(phone)).toBe(
          true,
        );
      });
    });

    it('should reject invalid E.164 format', () => {
      const invalidPhoneNumbers = [
        '1234567890', // Missing +
        '+0123456789', // Starts with 0
        '++1234567890', // Double +
        '+', // Just +
        '+1234567890123456', // Too long
        '+abc', // Contains letters
        '', // Empty
        '+1-234-567-890', // Contains dashes
        '+1 234 567 890', // Contains spaces
      ];

      invalidPhoneNumbers.forEach((phone) => {
        expect(TribConsentWorkspaceEntity.validatePhoneNumber(phone)).toBe(
          false,
        );
      });
    });

    it('should reject null and undefined phone numbers', () => {
      expect(TribConsentWorkspaceEntity.validatePhoneNumber(null as any)).toBe(
        false,
      );
      expect(
        TribConsentWorkspaceEntity.validatePhoneNumber(undefined as any),
      ).toBe(false);
    });
  });

  describe('validateStatusTransition', () => {
    it('should validate all valid status transitions', () => {
      // From UNKNOWN
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.UNKNOWN,
          ConsentStatus.PENDING,
        ),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.UNKNOWN,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.UNKNOWN,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);

      // From PENDING
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.PENDING,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.PENDING,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);

      // From OPTED_IN
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(true);

      // From OPTED_OUT
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      // Invalid from OPTED_IN
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.UNKNOWN,
        ),
      ).toBe(false);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.PENDING,
        ),
      ).toBe(false);

      // Invalid from OPTED_OUT
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.UNKNOWN,
        ),
      ).toBe(false);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.PENDING,
        ),
      ).toBe(false);

      // Same status transitions
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_IN,
          ConsentStatus.OPTED_IN,
        ),
      ).toBe(false);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.OPTED_OUT,
          ConsentStatus.OPTED_OUT,
        ),
      ).toBe(false);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.PENDING,
          ConsentStatus.PENDING,
        ),
      ).toBe(false);
      expect(
        TribConsentWorkspaceEntity.validateStatusTransition(
          ConsentStatus.UNKNOWN,
          ConsentStatus.UNKNOWN,
        ),
      ).toBe(false);
    });
  });

  describe('validateConsentDates', () => {
    it('should validate consistent dates', () => {
      const optInDate = new Date('2023-01-01');
      const optOutDate = new Date('2023-06-01');

      expect(
        TribConsentWorkspaceEntity.validateConsentDates(optInDate, optOutDate),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.validateConsentDates(optInDate, null),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.validateConsentDates(null, optOutDate),
      ).toBe(true);
      expect(TribConsentWorkspaceEntity.validateConsentDates(null, null)).toBe(
        true,
      );
    });

    it('should reject inconsistent dates', () => {
      const optInDate = new Date('2023-06-01');
      const optOutDate = new Date('2023-01-01');

      expect(
        TribConsentWorkspaceEntity.validateConsentDates(optInDate, optOutDate),
      ).toBe(false);

      // Same dates should also fail
      expect(
        TribConsentWorkspaceEntity.validateConsentDates(optInDate, optInDate),
      ).toBe(false);
    });
  });

  describe('isConsentExpired', () => {
    it('should return false for null opt-in date', () => {
      expect(TribConsentWorkspaceEntity.isConsentExpired(null)).toBe(false);
    });

    it('should return false for recent opt-in date', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      expect(TribConsentWorkspaceEntity.isConsentExpired(recentDate)).toBe(
        false,
      );
    });

    it('should return true for old opt-in date', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 20);
      expect(TribConsentWorkspaceEntity.isConsentExpired(oldDate)).toBe(true);
    });

    it('should use explicit expiry date from metadata', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(
        TribConsentWorkspaceEntity.isConsentExpired(recentDate, {
          expiryDate: yesterday,
        }),
      ).toBe(true);
      expect(
        TribConsentWorkspaceEntity.isConsentExpired(recentDate, {
          expiryDate: tomorrow,
        }),
      ).toBe(false);
    });
  });

  describe('createAuditEntry', () => {
    it('should create a valid audit entry', () => {
      const metadata = { userAgent: 'Mozilla/5.0', ipAddress: '192.168.1.1' };
      const entry = TribConsentWorkspaceEntity.createAuditEntry(
        'opt-in',
        ConsentSource.WEB_FORM,
        metadata,
      );

      expect(entry.action).toBe('opt-in');
      expect(entry.source).toBe(ConsentSource.WEB_FORM);
      expect(entry.metadata).toBe(metadata);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should create audit entry without metadata', () => {
      const entry = TribConsentWorkspaceEntity.createAuditEntry(
        'opt-out',
        ConsentSource.SMS_KEYWORD,
      );

      expect(entry.action).toBe('opt-out');
      expect(entry.source).toBe(ConsentSource.SMS_KEYWORD);
      expect(entry.metadata).toBeUndefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('allowsMarketing', () => {
    it('should allow marketing for valid opted-in consent', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);

      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_IN,
          ConsentType.MARKETING,
          recentDate,
        ),
      ).toBe(true);

      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_IN,
          ConsentType.ALL,
          recentDate,
        ),
      ).toBe(true);
    });

    it('should not allow marketing for opted-out consent', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);

      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_OUT,
          ConsentType.MARKETING,
          recentDate,
        ),
      ).toBe(false);
    });

    it('should not allow marketing for wrong consent type', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);

      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_IN,
          ConsentType.TRANSACTIONAL,
          recentDate,
        ),
      ).toBe(false);
    });

    it('should not allow marketing for expired consent', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 20);

      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_IN,
          ConsentType.MARKETING,
          oldDate,
        ),
      ).toBe(false);
    });

    it('should allow marketing without opt-in date (current implementation)', () => {
      // Current implementation: isConsentExpired(null) returns false, so marketing is allowed
      expect(
        TribConsentWorkspaceEntity.allowsMarketing(
          ConsentStatus.OPTED_IN,
          ConsentType.MARKETING,
          null,
        ),
      ).toBe(true);
    });
  });

  describe('allowsTransactional', () => {
    it('should allow transactional messages for appropriate consent types', () => {
      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.OPTED_IN,
          ConsentType.TRANSACTIONAL,
        ),
      ).toBe(true);

      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.OPTED_IN,
          ConsentType.ALL,
        ),
      ).toBe(true);

      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.OPTED_IN,
          ConsentType.SERVICE,
        ),
      ).toBe(true);
    });

    it('should allow transactional messages for pending/unknown status', () => {
      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.PENDING,
          ConsentType.TRANSACTIONAL,
        ),
      ).toBe(true);

      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.UNKNOWN,
          ConsentType.TRANSACTIONAL,
        ),
      ).toBe(true);
    });

    it('should not allow transactional messages for opted-out consent', () => {
      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.OPTED_OUT,
          ConsentType.TRANSACTIONAL,
        ),
      ).toBe(false);
    });

    it('should not allow transactional messages for marketing-only consent', () => {
      expect(
        TribConsentWorkspaceEntity.allowsTransactional(
          ConsentStatus.OPTED_IN,
          ConsentType.MARKETING,
        ),
      ).toBe(false);
    });
  });

  describe('validateConsent', () => {
    it('should validate a complete valid consent record', () => {
      const validRecord = {
        phoneNumber: '+12125551234', // Valid US phone number
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

      const result = TribConsentWorkspaceEntity.validateConsent(validRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a minimal valid consent record', () => {
      const minimalRecord = {
        phoneNumber: '+12125551234', // Valid US phone number
        status: ConsentStatus.OPTED_IN,
        source: ConsentSource.WEB_FORM,
        optInDate: new Date('2023-01-01'),
      };

      const result = TribConsentWorkspaceEntity.validateConsent(minimalRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid consent record', () => {
      const invalidRecord = {
        phoneNumber: '123', // Invalid phone number
        status: ConsentStatus.OPTED_IN,
        source: ConsentSource.WEB_FORM,
        optInDate: null, // Missing required opt-in date for OPTED_IN status
      };

      const result = TribConsentWorkspaceEntity.validateConsent(invalidRecord);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty record', () => {
      const result = TribConsentWorkspaceEntity.validateConsent({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number is required');
      // Note: The validator may not check other fields if phone number is missing
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

import {
  TribPhoneNumberWorkspaceEntity,
  TribPhoneNumberType,
  TribPhoneNumberStatus,
  TribVerificationMethod,
} from '../standard-objects/trib-phone-number.workspace-entity';

describe('TribPhoneNumberWorkspaceEntity', () => {
  let phoneNumber: TribPhoneNumberWorkspaceEntity;

  beforeEach(() => {
    phoneNumber = new TribPhoneNumberWorkspaceEntity();
  });

  describe('Entity creation and basic properties', () => {
    it('should create a new phone number entity', () => {
      expect(phoneNumber).toBeInstanceOf(TribPhoneNumberWorkspaceEntity);
    });

    it('should have default values for enum fields', () => {
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.PENDING_VERIFICATION;
      phoneNumber.validated = false;

      expect(phoneNumber.type).toBe(TribPhoneNumberType.MOBILE);
      expect(phoneNumber.status).toBe(
        TribPhoneNumberStatus.PENDING_VERIFICATION,
      );
      expect(phoneNumber.validated).toBe(false);
    });

    it('should allow setting all required fields', () => {
      phoneNumber.number = '+1234567890';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;
      phoneNumber.validated = true;

      expect(phoneNumber.number).toBe('+1234567890');
      expect(phoneNumber.type).toBe(TribPhoneNumberType.MOBILE);
      expect(phoneNumber.status).toBe(TribPhoneNumberStatus.ACTIVE);
      expect(phoneNumber.validated).toBe(true);
    });

    it('should allow setting optional fields', () => {
      phoneNumber.countryCode = 'US';
      phoneNumber.carrier = 'Verizon';
      phoneNumber.capabilities = ['SMS', 'MMS'];
      phoneNumber.region = 'New York';
      phoneNumber.timezone = 'America/New_York';
      phoneNumber.displayFormat = '+1 (234) 567-8900';
      phoneNumber.verificationMethod = TribVerificationMethod.SMS_CODE;
      phoneNumber.metadata = { twilioSid: 'PN123abc' };

      expect(phoneNumber.countryCode).toBe('US');
      expect(phoneNumber.carrier).toBe('Verizon');
      expect(phoneNumber.capabilities).toEqual(['SMS', 'MMS']);
      expect(phoneNumber.region).toBe('New York');
      expect(phoneNumber.timezone).toBe('America/New_York');
      expect(phoneNumber.displayFormat).toBe('+1 (234) 567-8900');
      expect(phoneNumber.verificationMethod).toBe(
        TribVerificationMethod.SMS_CODE,
      );
      expect(phoneNumber.metadata).toEqual({ twilioSid: 'PN123abc' });
    });
  });

  describe('validateE164Format', () => {
    it('should validate correct E.164 phone numbers', () => {
      const validNumbers = [
        '+1234567890',
        '+12345678901234',
        '+123456789012345', // 15 digits max
        '+12',
        '+1',
      ];

      validNumbers.forEach((number) => {
        expect(TribPhoneNumberWorkspaceEntity.validateE164Format(number)).toBe(
          true,
        );
      });
    });

    it('should reject invalid E.164 phone numbers', () => {
      const invalidNumbers = [
        '1234567890', // Missing +
        '+0123456789', // Starts with 0
        '+1234567890123456', // Too long (16 digits)
        '+', // Just +
        '+12345678a9', // Contains letters
        '+1234-567-890', // Contains dashes
        '+1 234 567 890', // Contains spaces
        '', // Empty string
        'invalid', // Not a number
        '+12345.6789', // Contains decimal
      ];

      invalidNumbers.forEach((number) => {
        expect(TribPhoneNumberWorkspaceEntity.validateE164Format(number)).toBe(
          false,
        );
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateE164Format(null as any),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateE164Format(undefined as any),
      ).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateE164Format(1234567890 as any),
      ).toBe(false);
      expect(TribPhoneNumberWorkspaceEntity.validateE164Format({} as any)).toBe(
        false,
      );
      expect(TribPhoneNumberWorkspaceEntity.validateE164Format([] as any)).toBe(
        false,
      );
    });
  });

  describe('validateCapabilities', () => {
    it('should validate TWILIO provider with valid capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', ['SMS']),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', [
          'SMS',
          'MMS',
        ]),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', [
          'SMS',
          'MMS',
          'VOICE',
        ]),
      ).toBe(true);
    });

    it('should validate AWS_SNS provider with SMS only', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', ['SMS']),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', ['MMS']),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', [
          'VOICE',
        ]),
      ).toBe(false);
    });

    it('should reject invalid providers', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('INVALID', ['SMS']),
      ).toBe(false);
    });

    it('should reject invalid capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', [
          'INVALID',
        ]),
      ).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(null as any, [
          'SMS',
        ]),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'TWILIO',
          null as any,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(undefined as any, [
          'SMS',
        ]),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'TWILIO',
          undefined as any,
        ),
      ).toBe(false);
    });

    it('should handle non-array capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'TWILIO',
          'SMS' as any,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'TWILIO',
          {} as any,
        ),
      ).toBe(false);
    });
  });

  describe('extractCountryCode', () => {
    it('should extract common country codes correctly', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('+1234567890'),
      ).toBe('1');
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('+44123456789'),
      ).toBe('44');
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('+49123456789'),
      ).toBe('49');
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('+33123456789'),
      ).toBe('33');
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('+91123456789'),
      ).toBe('91');
    });

    it('should return null for invalid phone numbers', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode('1234567890'),
      ).toBe(null);
      expect(TribPhoneNumberWorkspaceEntity.extractCountryCode('invalid')).toBe(
        null,
      );
      expect(TribPhoneNumberWorkspaceEntity.extractCountryCode('')).toBe(null);
    });

    it('should handle edge cases', () => {
      expect(TribPhoneNumberWorkspaceEntity.extractCountryCode('+1')).toBe('1');
      expect(TribPhoneNumberWorkspaceEntity.extractCountryCode('+999')).toBe(
        '999',
      );
    });

    it('should handle null and undefined inputs', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode(null as any),
      ).toBe(null);
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode(undefined as any),
      ).toBe(null);
    });
  });

  describe('typeSupportsCapability', () => {
    it('should validate MOBILE type capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.MOBILE,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.MOBILE,
          'MMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.MOBILE,
          'VOICE',
        ),
      ).toBe(true);
    });

    it('should validate LANDLINE type capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.LANDLINE,
          'SMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.LANDLINE,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.LANDLINE,
          'VOICE',
        ),
      ).toBe(true);
    });

    it('should validate TOLL_FREE type capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.TOLL_FREE,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.TOLL_FREE,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.TOLL_FREE,
          'VOICE',
        ),
      ).toBe(true);
    });

    it('should validate SHORT_CODE type capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.SHORT_CODE,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.SHORT_CODE,
          'MMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.SHORT_CODE,
          'VOICE',
        ),
      ).toBe(false);
    });

    it('should validate VOIP type capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.VOIP,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.VOIP,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.VOIP,
          'VOICE',
        ),
      ).toBe(true);
    });

    it('should return false for invalid capabilities', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          TribPhoneNumberType.MOBILE,
          'INVALID',
        ),
      ).toBe(false);
    });
  });

  describe('validateTimezone', () => {
    it('should validate correct IANA timezone formats', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Pacific/Honolulu',
        'America/Los_Angeles',
        'Europe/Berlin',
      ];

      validTimezones.forEach((timezone) => {
        expect(TribPhoneNumberWorkspaceEntity.validateTimezone(timezone)).toBe(
          true,
        );
      });
    });

    it('should reject invalid timezone formats', () => {
      const invalidTimezones = [
        'EST', // Abbreviation
        'GMT+5', // GMT offset
        'Invalid/Timezone', // Invalid format
        'America', // Missing second part
        'America/', // Missing timezone name
        '/New_York', // Missing continent
        '', // Empty string
        'UTC', // Not IANA format
      ];

      invalidTimezones.forEach((timezone) => {
        expect(TribPhoneNumberWorkspaceEntity.validateTimezone(timezone)).toBe(
          false,
        );
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(TribPhoneNumberWorkspaceEntity.validateTimezone(null as any)).toBe(
        false,
      );
      expect(
        TribPhoneNumberWorkspaceEntity.validateTimezone(undefined as any),
      ).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(TribPhoneNumberWorkspaceEntity.validateTimezone(123 as any)).toBe(
        false,
      );
      expect(TribPhoneNumberWorkspaceEntity.validateTimezone({} as any)).toBe(
        false,
      );
    });
  });

  describe('isVerified', () => {
    it('should return true for verified statuses', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(
          TribPhoneNumberStatus.VERIFIED,
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(TribPhoneNumberStatus.ACTIVE),
      ).toBe(true);
    });

    it('should return false for non-verified statuses', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(
          TribPhoneNumberStatus.PENDING_VERIFICATION,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(
          TribPhoneNumberStatus.INACTIVE,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(
          TribPhoneNumberStatus.SUSPENDED,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(
          TribPhoneNumberStatus.BLOCKED,
        ),
      ).toBe(false);
    });
  });

  describe('canSendMessages', () => {
    it('should return true for messaging-enabled statuses', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.ACTIVE,
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.VERIFIED,
        ),
      ).toBe(true);
    });

    it('should return false for messaging-disabled statuses', () => {
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.PENDING_VERIFICATION,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.INACTIVE,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.SUSPENDED,
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(
          TribPhoneNumberStatus.BLOCKED,
        ),
      ).toBe(false);
    });
  });

  describe('Enum values', () => {
    it('should have correct TribPhoneNumberType enum values', () => {
      expect(TribPhoneNumberType.MOBILE).toBe('MOBILE');
      expect(TribPhoneNumberType.LANDLINE).toBe('LANDLINE');
      expect(TribPhoneNumberType.TOLL_FREE).toBe('TOLL_FREE');
      expect(TribPhoneNumberType.SHORT_CODE).toBe('SHORT_CODE');
      expect(TribPhoneNumberType.VOIP).toBe('VOIP');
    });

    it('should have correct TribPhoneNumberStatus enum values', () => {
      expect(TribPhoneNumberStatus.ACTIVE).toBe('ACTIVE');
      expect(TribPhoneNumberStatus.INACTIVE).toBe('INACTIVE');
      expect(TribPhoneNumberStatus.SUSPENDED).toBe('SUSPENDED');
      expect(TribPhoneNumberStatus.PENDING_VERIFICATION).toBe(
        'PENDING_VERIFICATION',
      );
      expect(TribPhoneNumberStatus.VERIFIED).toBe('VERIFIED');
      expect(TribPhoneNumberStatus.BLOCKED).toBe('BLOCKED');
    });

    it('should have correct TribVerificationMethod enum values', () => {
      expect(TribVerificationMethod.SMS_CODE).toBe('SMS_CODE');
      expect(TribVerificationMethod.VOICE_CALL).toBe('VOICE_CALL');
      expect(TribVerificationMethod.CARRIER_LOOKUP).toBe('CARRIER_LOOKUP');
      expect(TribVerificationMethod.MANUAL).toBe('MANUAL');
      expect(TribVerificationMethod.WEBHOOK).toBe('WEBHOOK');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical US mobile number setup', () => {
      phoneNumber.number = '+12345678901';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;
      phoneNumber.countryCode = 'US';
      phoneNumber.capabilities = ['SMS', 'MMS'];
      phoneNumber.validated = true;

      expect(
        TribPhoneNumberWorkspaceEntity.validateE164Format(phoneNumber.number),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.extractCountryCode(phoneNumber.number),
      ).toBe('1');
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          phoneNumber.type,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(phoneNumber.status),
      ).toBe(true);
    });

    it('should handle Twilio provider setup', () => {
      const provider = 'TWILIO';
      const capabilities = ['SMS', 'MMS', 'VOICE'];

      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          provider,
          capabilities,
        ),
      ).toBe(true);
    });

    it('should handle toll-free number restrictions', () => {
      phoneNumber.type = TribPhoneNumberType.TOLL_FREE;

      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          phoneNumber.type,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          phoneNumber.type,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          phoneNumber.type,
          'VOICE',
        ),
      ).toBe(true);
    });

    it('should handle pending verification workflow', () => {
      phoneNumber.status = TribPhoneNumberStatus.PENDING_VERIFICATION;
      phoneNumber.verificationMethod = TribVerificationMethod.SMS_CODE;
      phoneNumber.validated = false;

      expect(
        TribPhoneNumberWorkspaceEntity.isVerified(phoneNumber.status),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(phoneNumber.status),
      ).toBe(false);
    });
  });
});

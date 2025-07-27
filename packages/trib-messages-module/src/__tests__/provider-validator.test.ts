import {
  validateProviderCapabilities,
  getProviderCapabilities,
  isValidProvider,
  getAllProviders,
  MessageProvider,
  MessageCapability,
} from '../utils/validation/provider-validator';

describe('Provider Validator', () => {
  describe('validateProviderCapabilities', () => {
    const TWILIO_PROVIDER = 'TWILIO';
    const AWS_SNS_PROVIDER = 'AWS_SNS';
    const AZURE_PROVIDER = 'AZURE_COMMUNICATION';
    const INVALID_PROVIDER = 'INVALID_PROVIDER';

    const SMS_CAPABILITY = 'SMS';
    const MMS_CAPABILITY = 'MMS';
    const VOICE_CAPABILITY = 'VOICE';
    const INVALID_CAPABILITY = 'INVALID_CAPABILITY';

    it('should return true for valid TWILIO provider with SMS capability', () => {
      const result = validateProviderCapabilities(TWILIO_PROVIDER, [
        SMS_CAPABILITY,
      ]);
      expect(result).toBe(true);
    });

    it('should return true for valid TWILIO provider with all capabilities', () => {
      const result = validateProviderCapabilities(TWILIO_PROVIDER, [
        SMS_CAPABILITY,
        MMS_CAPABILITY,
        VOICE_CAPABILITY,
      ]);
      expect(result).toBe(true);
    });

    it('should return true for AWS_SNS provider with SMS capability', () => {
      const result = validateProviderCapabilities(AWS_SNS_PROVIDER, [
        SMS_CAPABILITY,
      ]);
      expect(result).toBe(true);
    });

    it('should return false for AWS_SNS provider with MMS capability', () => {
      const result = validateProviderCapabilities(AWS_SNS_PROVIDER, [
        MMS_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return false for AWS_SNS provider with Voice capability', () => {
      const result = validateProviderCapabilities(AWS_SNS_PROVIDER, [
        VOICE_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return true for AZURE provider with SMS and MMS capabilities', () => {
      const result = validateProviderCapabilities(AZURE_PROVIDER, [
        SMS_CAPABILITY,
        MMS_CAPABILITY,
      ]);
      expect(result).toBe(true);
    });

    it('should return false for AZURE provider with Voice capability', () => {
      const result = validateProviderCapabilities(AZURE_PROVIDER, [
        VOICE_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return false for invalid provider', () => {
      const result = validateProviderCapabilities(INVALID_PROVIDER, [
        SMS_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return false for valid provider with invalid capability', () => {
      const result = validateProviderCapabilities(TWILIO_PROVIDER, [
        INVALID_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return false for valid provider with mixed valid and invalid capabilities', () => {
      const result = validateProviderCapabilities(TWILIO_PROVIDER, [
        SMS_CAPABILITY,
        INVALID_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should return true for empty capabilities array', () => {
      const result = validateProviderCapabilities(TWILIO_PROVIDER, []);
      expect(result).toBe(true);
    });

    it('should handle case sensitivity correctly', () => {
      const result = validateProviderCapabilities('twilio', [SMS_CAPABILITY]);
      expect(result).toBe(false);
    });

    it('should handle null provider gracefully', () => {
      const result = validateProviderCapabilities(null as any, [
        SMS_CAPABILITY,
      ]);
      expect(result).toBe(false);
    });

    it('should handle undefined capabilities gracefully', () => {
      const result = validateProviderCapabilities(
        TWILIO_PROVIDER,
        undefined as any,
      );
      expect(result).toBe(false);
    });
  });

  describe('getProviderCapabilities', () => {
    it('should return correct capabilities for TWILIO', () => {
      const capabilities = getProviderCapabilities('TWILIO');
      expect(capabilities).toEqual(['SMS', 'MMS', 'VOICE']);
    });

    it('should return correct capabilities for AWS_SNS', () => {
      const capabilities = getProviderCapabilities('AWS_SNS');
      expect(capabilities).toEqual(['SMS']);
    });

    it('should return correct capabilities for AZURE_COMMUNICATION', () => {
      const capabilities = getProviderCapabilities('AZURE_COMMUNICATION');
      expect(capabilities).toEqual(['SMS', 'MMS']);
    });

    it('should return empty array for invalid provider', () => {
      const capabilities = getProviderCapabilities('INVALID_PROVIDER');
      expect(capabilities).toEqual([]);
    });

    it('should return empty array for null provider', () => {
      const capabilities = getProviderCapabilities(null as any);
      expect(capabilities).toEqual([]);
    });

    it('should return empty array for undefined provider', () => {
      const capabilities = getProviderCapabilities(undefined as any);
      expect(capabilities).toEqual([]);
    });
  });

  describe('isValidProvider', () => {
    it('should return true for valid TWILIO provider', () => {
      const result = isValidProvider('TWILIO');
      expect(result).toBe(true);
    });

    it('should return true for valid AWS_SNS provider', () => {
      const result = isValidProvider('AWS_SNS');
      expect(result).toBe(true);
    });

    it('should return true for valid AZURE_COMMUNICATION provider', () => {
      const result = isValidProvider('AZURE_COMMUNICATION');
      expect(result).toBe(true);
    });

    it('should return false for invalid provider', () => {
      const result = isValidProvider('INVALID_PROVIDER');
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = isValidProvider('');
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = isValidProvider(null as any);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isValidProvider(undefined as any);
      expect(result).toBe(false);
    });

    it('should handle case sensitivity correctly', () => {
      const result = isValidProvider('twilio');
      expect(result).toBe(false);
    });
  });

  describe('getAllProviders', () => {
    it('should return all supported providers', () => {
      const providers = getAllProviders();
      expect(providers).toContain('TWILIO');
      expect(providers).toContain('AWS_SNS');
      expect(providers).toContain('AZURE_COMMUNICATION');
      expect(providers.length).toBe(3);
    });

    it('should return array of strings', () => {
      const providers = getAllProviders();
      providers.forEach((provider) => {
        expect(typeof provider).toBe('string');
      });
    });

    it('should return consistent results on multiple calls', () => {
      const providers1 = getAllProviders();
      const providers2 = getAllProviders();
      expect(providers1).toEqual(providers2);
    });
  });

  describe('MessageProvider enum', () => {
    it('should have correct enum values', () => {
      expect(MessageProvider.TWILIO).toBe('TWILIO');
      expect(MessageProvider.AWS_SNS).toBe('AWS_SNS');
      expect(MessageProvider.AZURE_COMMUNICATION).toBe('AZURE_COMMUNICATION');
    });

    it('should have exactly three providers', () => {
      const providerCount = Object.keys(MessageProvider).length;
      expect(providerCount).toBe(3);
    });
  });

  describe('MessageCapability enum', () => {
    it('should have correct enum values', () => {
      expect(MessageCapability.SMS).toBe('SMS');
      expect(MessageCapability.MMS).toBe('MMS');
      expect(MessageCapability.VOICE).toBe('VOICE');
    });

    it('should have exactly three capabilities', () => {
      const capabilityCount = Object.keys(MessageCapability).length;
      expect(capabilityCount).toBe(3);
    });
  });

  describe('Provider capability matrix validation', () => {
    it('should validate TWILIO supports all capabilities', () => {
      expect(validateProviderCapabilities('TWILIO', ['SMS'])).toBe(true);
      expect(validateProviderCapabilities('TWILIO', ['MMS'])).toBe(true);
      expect(validateProviderCapabilities('TWILIO', ['VOICE'])).toBe(true);
    });

    it('should validate AWS_SNS only supports SMS', () => {
      expect(validateProviderCapabilities('AWS_SNS', ['SMS'])).toBe(true);
      expect(validateProviderCapabilities('AWS_SNS', ['MMS'])).toBe(false);
      expect(validateProviderCapabilities('AWS_SNS', ['VOICE'])).toBe(false);
    });

    it('should validate AZURE_COMMUNICATION supports SMS and MMS but not VOICE', () => {
      expect(validateProviderCapabilities('AZURE_COMMUNICATION', ['SMS'])).toBe(
        true,
      );
      expect(validateProviderCapabilities('AZURE_COMMUNICATION', ['MMS'])).toBe(
        true,
      );
      expect(
        validateProviderCapabilities('AZURE_COMMUNICATION', ['VOICE']),
      ).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle multiple invalid capabilities', () => {
      const result = validateProviderCapabilities('TWILIO', [
        'INVALID1',
        'INVALID2',
        'INVALID3',
      ]);
      expect(result).toBe(false);
    });

    it('should handle provider with unsupported capability combination', () => {
      const result = validateProviderCapabilities('AWS_SNS', [
        'SMS',
        'MMS',
        'VOICE',
      ]);
      expect(result).toBe(false);
    });

    it('should handle numeric provider name', () => {
      const result = validateProviderCapabilities(123 as any, ['SMS']);
      expect(result).toBe(false);
    });

    it('should handle non-string capabilities', () => {
      const result = validateProviderCapabilities('TWILIO', [
        123,
        'SMS',
      ] as any);
      expect(result).toBe(false);
    });

    it('should handle object as provider', () => {
      const result = validateProviderCapabilities({} as any, ['SMS']);
      expect(result).toBe(false);
    });

    it('should handle array as capabilities', () => {
      const result = validateProviderCapabilities('TWILIO', [['SMS']] as any);
      expect(result).toBe(false);
    });
  });

  describe('Real-world integration scenarios', () => {
    it('should validate typical Twilio SMS setup', () => {
      const result = validateProviderCapabilities('TWILIO', ['SMS']);
      expect(result).toBe(true);
    });

    it('should validate Twilio multimedia messaging setup', () => {
      const result = validateProviderCapabilities('TWILIO', ['SMS', 'MMS']);
      expect(result).toBe(true);
    });

    it('should validate AWS SNS basic SMS setup', () => {
      const result = validateProviderCapabilities('AWS_SNS', ['SMS']);
      expect(result).toBe(true);
    });

    it('should reject AWS SNS multimedia setup', () => {
      const result = validateProviderCapabilities('AWS_SNS', ['SMS', 'MMS']);
      expect(result).toBe(false);
    });

    it('should validate Azure Communication Services SMS/MMS setup', () => {
      const result = validateProviderCapabilities('AZURE_COMMUNICATION', [
        'SMS',
        'MMS',
      ]);
      expect(result).toBe(true);
    });

    it('should reject Azure Communication Services voice setup', () => {
      const result = validateProviderCapabilities('AZURE_COMMUNICATION', [
        'VOICE',
      ]);
      expect(result).toBe(false);
    });
  });
});

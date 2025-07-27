import * as TribModule from '../index';

describe('TRIB Messages Module Index', () => {
  describe('Exported functions', () => {
    it('should export UUID generator functions', () => {
      expect(TribModule.generateTribUuid).toBeDefined();
      expect(TribModule.isValidTribUuid).toBeDefined();
      expect(TribModule.parseTribUuid).toBeDefined();
    });

    it('should export object ID constants', () => {
      expect(TribModule.TRIB_MESSAGE_OBJECT_IDS).toBeDefined();
      expect(TribModule.TRIB_CONTACT_OBJECT_IDS).toBeDefined();
      expect(TribModule.TRIB_INTEGRATION_OBJECT_IDS).toBeDefined();
      expect(TribModule.TRIB_WORKFLOW_OBJECT_IDS).toBeDefined();
      expect(TribModule.TRIB_SYSTEM_OBJECT_IDS).toBeDefined();
      expect(TribModule.TRIB_STANDARD_OBJECT_IDS).toBeDefined();
    });

    it('should export helper functions', () => {
      expect(TribModule.getTribObjectId).toBeDefined();
      expect(TribModule.isValidTribStandardObjectId).toBeDefined();
    });

    it('should export package info', () => {
      expect(TribModule.TRIB_PACKAGE_INFO).toBeDefined();
      expect(TribModule.TRIB_PACKAGE_INFO.name).toBe(
        '@twenty/trib-messages-module',
      );
      expect(TribModule.TRIB_PACKAGE_INFO.version).toBe('1.0.0');
    });
  });

  describe('Function integration', () => {
    it('should work with exported functions', () => {
      const uuid = TribModule.generateTribUuid('TEST', 1);
      expect(TribModule.isValidTribUuid(uuid)).toBe(true);

      const parsed = TribModule.parseTribUuid(uuid);
      expect(parsed).toEqual({ category: 'TEST', index: 1 });
    });

    it('should work with object ID helpers', () => {
      const smsMessageId = TribModule.getTribObjectId('SMS_MESSAGE');
      expect(TribModule.isValidTribStandardObjectId(smsMessageId)).toBe(true);
      expect(smsMessageId).toBe(TribModule.TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE);
    });
  });

  describe('Package info validation', () => {
    it('should have correct package metadata', () => {
      expect(TribModule.TRIB_PACKAGE_INFO.name).toBe(
        '@twenty/trib-messages-module',
      );
      expect(TribModule.TRIB_PACKAGE_INFO.version).toBe('1.0.0');
      expect(TribModule.TRIB_PACKAGE_INFO.description).toContain('TRIB');
      expect(TribModule.TRIB_PACKAGE_INFO.description).toContain('Twenty');
    });

    it('should not allow modification of package info', () => {
      expect(() => {
        // @ts-expect-error: Testing immutability
        TribModule.TRIB_PACKAGE_INFO.name = 'modified';
      }).toThrow();
    });
  });

  describe('Type exports', () => {
    it('should export TypeScript types', () => {
      // This test validates that types are exported without runtime errors
      // TypeScript will catch any type-related issues at compile time
      const messageId: TribModule.TribMessageObjectId =
        TribModule.TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE;
      const contactId: TribModule.TribContactObjectId =
        TribModule.TRIB_CONTACT_OBJECT_IDS.CONTACT_PERSON;
      const integrationId: TribModule.TribIntegrationObjectId =
        TribModule.TRIB_INTEGRATION_OBJECT_IDS.API_INTEGRATION;
      const workflowId: TribModule.TribWorkflowObjectId =
        TribModule.TRIB_WORKFLOW_OBJECT_IDS.WORKFLOW_DEFINITION;
      const systemId: TribModule.TribSystemObjectId =
        TribModule.TRIB_SYSTEM_OBJECT_IDS.USER;

      const standardId: TribModule.TribStandardObjectId = messageId;

      expect(typeof messageId).toBe('string');
      expect(typeof contactId).toBe('string');
      expect(typeof integrationId).toBe('string');
      expect(typeof workflowId).toBe('string');
      expect(typeof systemId).toBe('string');
      expect(typeof standardId).toBe('string');
    });
  });
});

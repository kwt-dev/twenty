import {
  TRIB_MESSAGE_OBJECT_IDS,
  TRIB_PHONE_NUMBER_OBJECT_IDS,
  TRIB_DELIVERY_OBJECT_IDS,
  TRIB_CONTACT_OBJECT_IDS,
  TRIB_CONSENT_OBJECT_IDS,
  TRIB_INTEGRATION_OBJECT_IDS,
  TRIB_WORKFLOW_OBJECT_IDS,
  TRIB_SYSTEM_OBJECT_IDS,
  TRIB_STANDARD_OBJECT_IDS,
  getTribObjectId,
  isValidTribStandardObjectId,
} from '../constants/trib-standard-object-ids';
import { isValidTribUuid } from '../utils/uuid-generator';

describe('TRIB Standard Object IDs', () => {
  describe('Message Object IDs', () => {
    it('should have all required message object IDs', () => {
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('SMS_MESSAGE');
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('EMAIL_MESSAGE');
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('WHATSAPP_MESSAGE');
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('MESSAGE_THREAD');
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('MESSAGE_TEMPLATE');
      expect(TRIB_MESSAGE_OBJECT_IDS).toHaveProperty('MESSAGE_ATTACHMENT');
    });
  });

  describe('Phone Number Object IDs', () => {
    it('should have all required phone number object IDs', () => {
      expect(TRIB_PHONE_NUMBER_OBJECT_IDS).toHaveProperty('PHONE_NUMBER');
    });
  });

  describe('Delivery Object IDs', () => {
    it('should have all required delivery object IDs', () => {
      expect(TRIB_DELIVERY_OBJECT_IDS).toHaveProperty('DELIVERY');
    });

    it('should generate valid TRIB UUIDs for message objects', () => {
      Object.values(TRIB_MESSAGE_OBJECT_IDS).forEach((id) => {
        expect(isValidTribUuid(id)).toBe(true);
      });
    });

    it('should use MSG category for message objects', () => {
      Object.values(TRIB_MESSAGE_OBJECT_IDS).forEach((id) => {
        expect(id).toMatch(/^20202020-MSG0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
      });
    });

    it('should have unique IDs for each message object', () => {
      const ids = Object.values(TRIB_MESSAGE_OBJECT_IDS);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Contact Object IDs', () => {
    it('should have all required contact object IDs', () => {
      expect(TRIB_CONTACT_OBJECT_IDS).toHaveProperty('CONTACT_PERSON');
      expect(TRIB_CONTACT_OBJECT_IDS).toHaveProperty('CONTACT_COMPANY');
      expect(TRIB_CONTACT_OBJECT_IDS).toHaveProperty('CONTACT_PHONE');
      expect(TRIB_CONTACT_OBJECT_IDS).toHaveProperty('CONTACT_EMAIL');
      expect(TRIB_CONTACT_OBJECT_IDS).toHaveProperty('CONTACT_ADDRESS');
    });

    it('should generate valid TRIB UUIDs for contact objects', () => {
      Object.values(TRIB_CONTACT_OBJECT_IDS).forEach((id) => {
        expect(isValidTribUuid(id)).toBe(true);
      });
    });

    it('should use CNT category for contact objects', () => {
      Object.values(TRIB_CONTACT_OBJECT_IDS).forEach((id) => {
        expect(id).toMatch(/^20202020-CNT0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
      });
    });
  });

  describe('Integration Object IDs', () => {
    it('should have all required integration object IDs', () => {
      expect(TRIB_INTEGRATION_OBJECT_IDS).toHaveProperty('API_INTEGRATION');
      expect(TRIB_INTEGRATION_OBJECT_IDS).toHaveProperty('WEBHOOK_INTEGRATION');
      expect(TRIB_INTEGRATION_OBJECT_IDS).toHaveProperty(
        'CALENDAR_INTEGRATION',
      );
      expect(TRIB_INTEGRATION_OBJECT_IDS).toHaveProperty(
        'EMAIL_PROVIDER_INTEGRATION',
      );
      expect(TRIB_INTEGRATION_OBJECT_IDS).toHaveProperty(
        'SMS_PROVIDER_INTEGRATION',
      );
    });

    it('should use INT category for integration objects', () => {
      Object.values(TRIB_INTEGRATION_OBJECT_IDS).forEach((id) => {
        expect(id).toMatch(/^20202020-INT0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
      });
    });
  });

  describe('Workflow Object IDs', () => {
    it('should have all required workflow object IDs', () => {
      expect(TRIB_WORKFLOW_OBJECT_IDS).toHaveProperty('WORKFLOW_DEFINITION');
      expect(TRIB_WORKFLOW_OBJECT_IDS).toHaveProperty('WORKFLOW_EXECUTION');
      expect(TRIB_WORKFLOW_OBJECT_IDS).toHaveProperty('WORKFLOW_STEP');
      expect(TRIB_WORKFLOW_OBJECT_IDS).toHaveProperty('WORKFLOW_TRIGGER');
      expect(TRIB_WORKFLOW_OBJECT_IDS).toHaveProperty('WORKFLOW_ACTION');
    });

    it('should use WFL category for workflow objects', () => {
      Object.values(TRIB_WORKFLOW_OBJECT_IDS).forEach((id) => {
        expect(id).toMatch(/^20202020-WFL0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
      });
    });
  });

  describe('System Object IDs', () => {
    it('should have all required system object IDs', () => {
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('USER');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('ROLE');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('PERMISSION');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('WORKSPACE');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('WORKSPACE_MEMBER');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('AUDIT_LOG');
      expect(TRIB_SYSTEM_OBJECT_IDS).toHaveProperty('CONFIGURATION');
    });

    it('should use appropriate categories for system objects', () => {
      // User-related objects should use USR category
      expect(TRIB_SYSTEM_OBJECT_IDS.USER).toMatch(
        /^20202020-USR0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );
      expect(TRIB_SYSTEM_OBJECT_IDS.ROLE).toMatch(
        /^20202020-USR0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );
      expect(TRIB_SYSTEM_OBJECT_IDS.PERMISSION).toMatch(
        /^20202020-USR0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );

      // Workspace-related objects should use WKS category
      expect(TRIB_SYSTEM_OBJECT_IDS.WORKSPACE).toMatch(
        /^20202020-WKS0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );
      expect(TRIB_SYSTEM_OBJECT_IDS.WORKSPACE_MEMBER).toMatch(
        /^20202020-WKS0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );

      // System-related objects should use SYS category
      expect(TRIB_SYSTEM_OBJECT_IDS.AUDIT_LOG).toMatch(
        /^20202020-SYS0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );
      expect(TRIB_SYSTEM_OBJECT_IDS.CONFIGURATION).toMatch(
        /^20202020-SYS0-\d{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      );
    });
  });

  describe('Combined Standard Object IDs', () => {
    it('should include all object IDs from all categories', () => {
      const allIds = {
        ...TRIB_MESSAGE_OBJECT_IDS,
        ...TRIB_PHONE_NUMBER_OBJECT_IDS,
        ...TRIB_DELIVERY_OBJECT_IDS,
        ...TRIB_CONTACT_OBJECT_IDS,
        ...TRIB_CONSENT_OBJECT_IDS,
        ...TRIB_INTEGRATION_OBJECT_IDS,
        ...TRIB_WORKFLOW_OBJECT_IDS,
        ...TRIB_SYSTEM_OBJECT_IDS,
      };

      expect(Object.keys(TRIB_STANDARD_OBJECT_IDS)).toEqual(
        Object.keys(allIds),
      );
    });

    it('should have unique IDs across all categories', () => {
      const allIds = Object.values(TRIB_STANDARD_OBJECT_IDS);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should contain only valid TRIB UUIDs', () => {
      Object.values(TRIB_STANDARD_OBJECT_IDS).forEach((id) => {
        expect(isValidTribUuid(id)).toBe(true);
      });
    });
  });

  describe('getTribObjectId', () => {
    it('should return correct ID for valid object names', () => {
      expect(getTribObjectId('SMS_MESSAGE')).toBe(
        TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE,
      );
      expect(getTribObjectId('CONTACT_PERSON')).toBe(
        TRIB_CONTACT_OBJECT_IDS.CONTACT_PERSON,
      );
      expect(getTribObjectId('API_INTEGRATION')).toBe(
        TRIB_INTEGRATION_OBJECT_IDS.API_INTEGRATION,
      );
      expect(getTribObjectId('WORKFLOW_DEFINITION')).toBe(
        TRIB_WORKFLOW_OBJECT_IDS.WORKFLOW_DEFINITION,
      );
      expect(getTribObjectId('USER')).toBe(TRIB_SYSTEM_OBJECT_IDS.USER);
    });
  });

  describe('isValidTribStandardObjectId', () => {
    it('should return true for valid standard object IDs', () => {
      Object.values(TRIB_STANDARD_OBJECT_IDS).forEach((id) => {
        expect(isValidTribStandardObjectId(id)).toBe(true);
      });
    });

    it('should return false for invalid IDs', () => {
      expect(isValidTribStandardObjectId('invalid-id')).toBe(false);
      expect(
        isValidTribStandardObjectId('20202020-INVALID-0001-1A2B-3C4D5E6F7890'),
      ).toBe(false);
      expect(isValidTribStandardObjectId('')).toBe(false);
    });

    it('should return false for valid TRIB UUIDs that are not standard object IDs', () => {
      const customId = '20202020-CUST-0001-1A2B-3C4D5E6F7890';
      expect(isValidTribStandardObjectId(customId)).toBe(false);
    });
  });

  describe('Constants immutability', () => {
    it('should not allow modification of object ID constants', () => {
      expect(() => {
        // @ts-expect-error: Testing immutability
        TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE = 'modified';
      }).toThrow();
    });

    it('should not allow addition of new properties to constants', () => {
      expect(() => {
        // @ts-expect-error: Testing immutability
        TRIB_MESSAGE_OBJECT_IDS.NEW_PROPERTY = 'new-value';
      }).toThrow();
    });
  });
});

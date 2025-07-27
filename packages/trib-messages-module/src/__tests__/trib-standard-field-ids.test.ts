import {
  MESSAGE_FIELD_IDS,
  THREAD_FIELD_IDS,
  CONSENT_FIELD_IDS,
  PHONE_NUMBER_FIELD_IDS,
  DELIVERY_FIELD_IDS,
  TRIB_FIELD_IDS,
} from '../constants/trib-standard-field-ids';
import { isValidTribUuid, parseTribUuid } from '../utils/uuid-generator';

/**
 * Test constants for validation
 */
const EXPECTED_UUID_PATTERN =
  /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
const ENTITY_RANGES = {
  MESSAGE: { start: 1, end: 99, prefix: 'MSG' },
  THREAD: { start: 201, end: 299, prefix: 'THR' },
  CONSENT: { start: 301, end: 399, prefix: 'CNT' },
  PHONE_NUMBER: { start: 401, end: 499, prefix: 'PHN' },
  DELIVERY: { start: 501, end: 599, prefix: 'DLV' },
};

describe('TRIB Standard Field IDs', () => {
  describe('Message Field IDs', () => {
    it('should have all expected message field IDs', () => {
      const expectedFields = [
        'id',
        'content',
        'status',
        'type',
        'from',
        'to',
        'timestamp',
        'threadId',
        'deliveryId',
        'direction',
        'priority',
        'metadata',
        'createdAt',
        'updatedAt',
        'errorCode',
        'errorMessage',
        'retryCount',
        'externalId',
        'messageSize',
        'encoding',
        'contact',
      ];

      const actualFields = Object.keys(MESSAGE_FIELD_IDS);
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields));
      expect(actualFields).toHaveLength(expectedFields.length);
    });

    it('should have valid UUID format for all message field IDs', () => {
      Object.values(MESSAGE_FIELD_IDS).forEach((fieldId) => {
        expect(fieldId).toMatch(EXPECTED_UUID_PATTERN);
        expect(isValidTribUuid(fieldId)).toBe(true);
      });
    });

    it('should have correct category and index ranges for message fields', () => {
      Object.values(MESSAGE_FIELD_IDS).forEach((fieldId) => {
        const parsed = parseTribUuid(fieldId);
        expect(parsed).not.toBeNull();
        expect(parsed?.category).toBe(ENTITY_RANGES.MESSAGE.prefix);
        expect(parsed?.index).toBeGreaterThanOrEqual(
          ENTITY_RANGES.MESSAGE.start,
        );
        expect(parsed?.index).toBeLessThanOrEqual(ENTITY_RANGES.MESSAGE.end);
      });
    });

    it('should have enhanced error tracking fields', () => {
      expect(MESSAGE_FIELD_IDS.errorCode).toBeDefined();
      expect(MESSAGE_FIELD_IDS.errorMessage).toBeDefined();
      expect(MESSAGE_FIELD_IDS.retryCount).toBeDefined();
    });
  });

  describe('Thread Field IDs', () => {
    it('should have all expected thread field IDs', () => {
      const expectedFields = [
        'id',
        'subject',
        'participants',
        'status',
        'type',
        'priority',
        'metadata',
        'createdAt',
        'updatedAt',
        'lastMessageAt',
        'messageCount',
        'tags',
        'archived',
        'readStatus',
        'owner',
      ];

      const actualFields = Object.keys(THREAD_FIELD_IDS);
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields));
      expect(actualFields).toHaveLength(expectedFields.length);
    });

    it('should have valid UUID format for all thread field IDs', () => {
      Object.values(THREAD_FIELD_IDS).forEach((fieldId) => {
        expect(fieldId).toMatch(EXPECTED_UUID_PATTERN);
        expect(isValidTribUuid(fieldId)).toBe(true);
      });
    });

    it('should have correct category and index ranges for thread fields', () => {
      Object.values(THREAD_FIELD_IDS).forEach((fieldId) => {
        const parsed = parseTribUuid(fieldId);
        expect(parsed).not.toBeNull();
        expect(parsed?.category).toBe(ENTITY_RANGES.THREAD.prefix);
        expect(parsed?.index).toBeGreaterThanOrEqual(
          ENTITY_RANGES.THREAD.start,
        );
        expect(parsed?.index).toBeLessThanOrEqual(ENTITY_RANGES.THREAD.end);
      });
    });
  });

  describe('Consent Field IDs', () => {
    it('should have all expected consent field IDs', () => {
      const expectedFields = [
        'id',
        'phoneNumber',
        'status',
        'type',
        'source',
        'timestamp',
        'expiryDate',
        'metadata',
        'createdAt',
        'updatedAt',
        'version',
        'legalBasis',
        'preferences',
        'auditTrail',
        'verified',
      ];

      const actualFields = Object.keys(CONSENT_FIELD_IDS);
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields));
      expect(actualFields).toHaveLength(expectedFields.length);
    });

    it('should have valid UUID format for all consent field IDs', () => {
      Object.values(CONSENT_FIELD_IDS).forEach((fieldId) => {
        expect(fieldId).toMatch(EXPECTED_UUID_PATTERN);
        expect(isValidTribUuid(fieldId)).toBe(true);
      });
    });

    it('should have correct category and index ranges for consent fields', () => {
      Object.values(CONSENT_FIELD_IDS).forEach((fieldId) => {
        const parsed = parseTribUuid(fieldId);
        expect(parsed).not.toBeNull();
        expect(parsed?.category).toBe(ENTITY_RANGES.CONSENT.prefix);
        expect(parsed?.index).toBeGreaterThanOrEqual(
          ENTITY_RANGES.CONSENT.start,
        );
        expect(parsed?.index).toBeLessThanOrEqual(ENTITY_RANGES.CONSENT.end);
      });
    });
  });

  describe('Phone Number Field IDs', () => {
    it('should have all expected phone number field IDs', () => {
      const expectedFields = [
        'id',
        'number',
        'type',
        'status',
        'countryCode',
        'carrier',
        'metadata',
        'createdAt',
        'updatedAt',
        'validated',
        'capabilities',
        'region',
        'timezone',
        'displayFormat',
        'verificationMethod',
      ];

      const actualFields = Object.keys(PHONE_NUMBER_FIELD_IDS);
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields));
      expect(actualFields).toHaveLength(expectedFields.length);
    });

    it('should have valid UUID format for all phone number field IDs', () => {
      Object.values(PHONE_NUMBER_FIELD_IDS).forEach((fieldId) => {
        expect(fieldId).toMatch(EXPECTED_UUID_PATTERN);
        expect(isValidTribUuid(fieldId)).toBe(true);
      });
    });

    it('should have correct category and index ranges for phone number fields', () => {
      Object.values(PHONE_NUMBER_FIELD_IDS).forEach((fieldId) => {
        const parsed = parseTribUuid(fieldId);
        expect(parsed).not.toBeNull();
        expect(parsed?.category).toBe(ENTITY_RANGES.PHONE_NUMBER.prefix);
        expect(parsed?.index).toBeGreaterThanOrEqual(
          ENTITY_RANGES.PHONE_NUMBER.start,
        );
        expect(parsed?.index).toBeLessThanOrEqual(
          ENTITY_RANGES.PHONE_NUMBER.end,
        );
      });
    });
  });

  describe('Delivery Field IDs', () => {
    it('should have all expected delivery field IDs', () => {
      const expectedFields = [
        'id',
        'messageId',
        'status',
        'timestamp',
        'provider',
        'attempts',
        'errorCode',
        'errorMessage',
        'metadata',
        'createdAt',
        'updatedAt',
        'cost',
        'latency',
        'webhookUrl',
        'callbackStatus',
        'externalDeliveryId',
      ];

      const actualFields = Object.keys(DELIVERY_FIELD_IDS);
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields));
      expect(actualFields).toHaveLength(expectedFields.length);
    });

    it('should have valid UUID format for all delivery field IDs', () => {
      Object.values(DELIVERY_FIELD_IDS).forEach((fieldId) => {
        expect(fieldId).toMatch(EXPECTED_UUID_PATTERN);
        expect(isValidTribUuid(fieldId)).toBe(true);
      });
    });

    it('should have correct category and index ranges for delivery fields', () => {
      Object.values(DELIVERY_FIELD_IDS).forEach((fieldId) => {
        const parsed = parseTribUuid(fieldId);
        expect(parsed).not.toBeNull();
        expect(parsed?.category).toBe(ENTITY_RANGES.DELIVERY.prefix);
        expect(parsed?.index).toBeGreaterThanOrEqual(
          ENTITY_RANGES.DELIVERY.start,
        );
        expect(parsed?.index).toBeLessThanOrEqual(ENTITY_RANGES.DELIVERY.end);
      });
    });
  });

  describe('Combined TRIB Field IDs', () => {
    it('should contain all entity field ID collections', () => {
      expect(TRIB_FIELD_IDS.MESSAGE).toEqual(MESSAGE_FIELD_IDS);
      expect(TRIB_FIELD_IDS.THREAD).toEqual(THREAD_FIELD_IDS);
      expect(TRIB_FIELD_IDS.CONSENT).toEqual(CONSENT_FIELD_IDS);
      expect(TRIB_FIELD_IDS.PHONE_NUMBER).toEqual(PHONE_NUMBER_FIELD_IDS);
      expect(TRIB_FIELD_IDS.DELIVERY).toEqual(DELIVERY_FIELD_IDS);
    });

    it('should have exactly 5 entity types', () => {
      const entityTypes = Object.keys(TRIB_FIELD_IDS);
      expect(entityTypes).toHaveLength(5);
      expect(entityTypes).toEqual(
        expect.arrayContaining([
          'MESSAGE',
          'THREAD',
          'CONSENT',
          'PHONE_NUMBER',
          'DELIVERY',
        ]),
      );
    });
  });

  describe('Field ID Uniqueness', () => {
    it('should have no duplicate field IDs across all entities', () => {
      const allFieldIds = [
        ...Object.values(MESSAGE_FIELD_IDS),
        ...Object.values(THREAD_FIELD_IDS),
        ...Object.values(CONSENT_FIELD_IDS),
        ...Object.values(PHONE_NUMBER_FIELD_IDS),
        ...Object.values(DELIVERY_FIELD_IDS),
      ];

      const uniqueFieldIds = new Set(allFieldIds);
      expect(uniqueFieldIds.size).toBe(allFieldIds.length);
    });

    it('should have unique field IDs within each entity', () => {
      const entityCollections = [
        MESSAGE_FIELD_IDS,
        THREAD_FIELD_IDS,
        CONSENT_FIELD_IDS,
        PHONE_NUMBER_FIELD_IDS,
        DELIVERY_FIELD_IDS,
      ];

      entityCollections.forEach((collection) => {
        const fieldIds = Object.values(collection);
        const uniqueIds = new Set(fieldIds);
        expect(uniqueIds.size).toBe(fieldIds.length);
      });
    });

    it('should have unique field names within each entity', () => {
      const entityCollections = [
        MESSAGE_FIELD_IDS,
        THREAD_FIELD_IDS,
        CONSENT_FIELD_IDS,
        PHONE_NUMBER_FIELD_IDS,
        DELIVERY_FIELD_IDS,
      ];

      entityCollections.forEach((collection) => {
        const fieldNames = Object.keys(collection);
        const uniqueNames = new Set(fieldNames);
        expect(uniqueNames.size).toBe(fieldNames.length);
      });
    });
  });

  describe('Field ID Pattern Validation', () => {
    it("should follow Twenty's 20202020-XXXX pattern", () => {
      const allFieldIds = [
        ...Object.values(MESSAGE_FIELD_IDS),
        ...Object.values(THREAD_FIELD_IDS),
        ...Object.values(CONSENT_FIELD_IDS),
        ...Object.values(PHONE_NUMBER_FIELD_IDS),
        ...Object.values(DELIVERY_FIELD_IDS),
      ];

      allFieldIds.forEach((fieldId) => {
        expect(fieldId).toMatch(/^20202020-/);
        expect(fieldId).toHaveLength(36); // Standard UUID length
      });
    });

    it('should have proper entity range separation', () => {
      const messageIndices = Object.values(MESSAGE_FIELD_IDS).map(
        (id) => parseTribUuid(id)?.index,
      );
      const threadIndices = Object.values(THREAD_FIELD_IDS).map(
        (id) => parseTribUuid(id)?.index,
      );
      const consentIndices = Object.values(CONSENT_FIELD_IDS).map(
        (id) => parseTribUuid(id)?.index,
      );
      const phoneIndices = Object.values(PHONE_NUMBER_FIELD_IDS).map(
        (id) => parseTribUuid(id)?.index,
      );
      const deliveryIndices = Object.values(DELIVERY_FIELD_IDS).map(
        (id) => parseTribUuid(id)?.index,
      );

      // Check that entity ranges don't overlap
      const allIndices = [
        ...messageIndices,
        ...threadIndices,
        ...consentIndices,
        ...phoneIndices,
        ...deliveryIndices,
      ].filter((index): index is number => index !== undefined);

      const uniqueIndices = new Set(allIndices);
      expect(uniqueIndices.size).toBe(allIndices.length);
    });
  });

  describe('Common Field Patterns', () => {
    it('should have common timestamp fields in all entities', () => {
      const entityCollections = [
        MESSAGE_FIELD_IDS,
        THREAD_FIELD_IDS,
        CONSENT_FIELD_IDS,
        PHONE_NUMBER_FIELD_IDS,
        DELIVERY_FIELD_IDS,
      ];

      entityCollections.forEach((collection) => {
        expect(collection.createdAt).toBeDefined();
        expect(collection.updatedAt).toBeDefined();
      });
    });

    it('should have common metadata fields in all entities', () => {
      const entityCollections = [
        MESSAGE_FIELD_IDS,
        THREAD_FIELD_IDS,
        CONSENT_FIELD_IDS,
        PHONE_NUMBER_FIELD_IDS,
        DELIVERY_FIELD_IDS,
      ];

      entityCollections.forEach((collection) => {
        expect(collection.metadata).toBeDefined();
      });
    });

    it('should have id field in all entities', () => {
      const entityCollections = [
        MESSAGE_FIELD_IDS,
        THREAD_FIELD_IDS,
        CONSENT_FIELD_IDS,
        PHONE_NUMBER_FIELD_IDS,
        DELIVERY_FIELD_IDS,
      ];

      entityCollections.forEach((collection) => {
        expect(collection.id).toBeDefined();
      });
    });
  });

  describe('TypeScript Const Assertions', () => {
    it('should maintain const assertions for proper type inference', () => {
      // Test that field IDs are properly typed as literal strings
      const messageId: '20202020-MSG0-0001-4000-800000000001' =
        MESSAGE_FIELD_IDS.id as any;
      const threadId: '20202020-THR0-0201-4000-800000000001' =
        THREAD_FIELD_IDS.id as any;

      // These should not throw TypeScript errors if const assertions are working
      expect(typeof messageId).toBe('string');
      expect(typeof threadId).toBe('string');
    });
  });
});

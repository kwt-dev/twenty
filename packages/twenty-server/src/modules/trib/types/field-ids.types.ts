import {
  MESSAGE_FIELD_IDS,
  THREAD_FIELD_IDS,
  CONSENT_FIELD_IDS,
  PHONE_NUMBER_FIELD_IDS,
  DELIVERY_FIELD_IDS,
  TRIB_FIELD_IDS,
} from '../constants/trib-standard-field-ids';

/**
 * TRIB Field IDs Type Definitions
 *
 * This file provides comprehensive TypeScript type definitions for all TRIB field IDs.
 * These types ensure type safety when working with field IDs throughout the application.
 */

/**
 * Message entity field ID type - extracted from MESSAGE_FIELD_IDS constant
 */
export type MessageFieldId =
  (typeof MESSAGE_FIELD_IDS)[keyof typeof MESSAGE_FIELD_IDS];

/**
 * Thread entity field ID type - extracted from THREAD_FIELD_IDS constant
 */
export type ThreadFieldId =
  (typeof THREAD_FIELD_IDS)[keyof typeof THREAD_FIELD_IDS];

/**
 * Consent entity field ID type - extracted from CONSENT_FIELD_IDS constant
 */
export type ConsentFieldId =
  (typeof CONSENT_FIELD_IDS)[keyof typeof CONSENT_FIELD_IDS];

/**
 * Phone Number entity field ID type - extracted from PHONE_NUMBER_FIELD_IDS constant
 */
export type PhoneNumberFieldId =
  (typeof PHONE_NUMBER_FIELD_IDS)[keyof typeof PHONE_NUMBER_FIELD_IDS];

/**
 * Delivery entity field ID type - extracted from DELIVERY_FIELD_IDS constant
 */
export type DeliveryFieldId =
  (typeof DELIVERY_FIELD_IDS)[keyof typeof DELIVERY_FIELD_IDS];

/**
 * Union type of all possible TRIB field IDs
 */
export type TribFieldId =
  | MessageFieldId
  | ThreadFieldId
  | ConsentFieldId
  | PhoneNumberFieldId
  | DeliveryFieldId;

/**
 * Message field names as literal union type
 */
export type MessageFieldName = keyof typeof MESSAGE_FIELD_IDS;

/**
 * Thread field names as literal union type
 */
export type ThreadFieldName = keyof typeof THREAD_FIELD_IDS;

/**
 * Consent field names as literal union type
 */
export type ConsentFieldName = keyof typeof CONSENT_FIELD_IDS;

/**
 * Phone Number field names as literal union type
 */
export type PhoneNumberFieldName = keyof typeof PHONE_NUMBER_FIELD_IDS;

/**
 * Delivery field names as literal union type
 */
export type DeliveryFieldName = keyof typeof DELIVERY_FIELD_IDS;

/**
 * Union type of all possible TRIB field names
 */
export type TribFieldName =
  | MessageFieldName
  | ThreadFieldName
  | ConsentFieldName
  | PhoneNumberFieldName
  | DeliveryFieldName;

/**
 * TRIB entity type enumeration
 */
export type TribEntityType =
  | 'MESSAGE'
  | 'THREAD'
  | 'CONSENT'
  | 'PHONE_NUMBER'
  | 'DELIVERY';

/**
 * Map of entity types to their corresponding field ID types
 */
export interface TribEntityFieldIdMap {
  MESSAGE: MessageFieldId;
  THREAD: ThreadFieldId;
  CONSENT: ConsentFieldId;
  PHONE_NUMBER: PhoneNumberFieldId;
  DELIVERY: DeliveryFieldId;
}

/**
 * Map of entity types to their corresponding field name types
 */
export interface TribEntityFieldNameMap {
  MESSAGE: MessageFieldName;
  THREAD: ThreadFieldName;
  CONSENT: ConsentFieldName;
  PHONE_NUMBER: PhoneNumberFieldName;
  DELIVERY: DeliveryFieldName;
}

/**
 * Generic type for field configuration objects
 */
export interface TribFieldConfig<T extends TribEntityType> {
  fieldId: TribEntityFieldIdMap[T];
  fieldName: TribEntityFieldNameMap[T];
  entityType: T;
  displayName?: string;
  description?: string;
  isRequired?: boolean;
  isIndexed?: boolean;
}

/**
 * Type guard to check if a string is a valid TRIB field ID
 */
export type TribFieldIdValidator = (value: string) => value is TribFieldId;

/**
 * Type for field ID validation result
 */
export interface TribFieldIdValidationResult {
  isValid: boolean;
  entityType?: TribEntityType;
  fieldName?: TribFieldName;
  category?: string;
  index?: number;
}

/**
 * Type for field ID parsing result
 */
export interface TribFieldIdParseResult {
  fieldId: TribFieldId;
  entityType: TribEntityType;
  fieldName: TribFieldName;
  category: string;
  index: number;
}

/**
 * Utility type to extract field IDs for a specific entity
 */
export type ExtractEntityFieldIds<T extends TribEntityType> =
  (typeof TRIB_FIELD_IDS)[T];

/**
 * Utility type to extract field names for a specific entity
 */
export type ExtractEntityFieldNames<T extends TribEntityType> =
  keyof (typeof TRIB_FIELD_IDS)[T];

/**
 * Type for field ID constants object structure
 */
export interface TribFieldIdsConstant {
  readonly MESSAGE: typeof MESSAGE_FIELD_IDS;
  readonly THREAD: typeof THREAD_FIELD_IDS;
  readonly CONSENT: typeof CONSENT_FIELD_IDS;
  readonly PHONE_NUMBER: typeof PHONE_NUMBER_FIELD_IDS;
  readonly DELIVERY: typeof DELIVERY_FIELD_IDS;
}

/**
 * Type for field ID ranges by entity
 */
export interface TribFieldIdRanges {
  MESSAGE: {
    start: 1;
    end: 99;
    prefix: 'MSG';
  };
  THREAD: {
    start: 201;
    end: 299;
    prefix: 'THR';
  };
  CONSENT: {
    start: 301;
    end: 399;
    prefix: 'CNT';
  };
  PHONE_NUMBER: {
    start: 401;
    end: 499;
    prefix: 'PHN';
  };
  DELIVERY: {
    start: 501;
    end: 599;
    prefix: 'DLV';
  };
}

/**
 * Type for field ID metadata
 */
export interface TribFieldIdMetadata {
  pattern: string;
  entityRanges: TribFieldIdRanges;
  totalFields: number;
  version: string;
}

/**
 * Type for workspace field decorator compatibility
 */
export interface WorkspaceFieldDecoratorConfig {
  fieldId: TribFieldId;
  type: string;
  isNullable?: boolean;
  isIndexed?: boolean;
  description?: string;
}

/**
 * Type for enhanced error tracking fields (Message entity specific)
 */
export interface MessageErrorTrackingFields {
  errorCode: typeof MESSAGE_FIELD_IDS.errorCode;
  errorMessage: typeof MESSAGE_FIELD_IDS.errorMessage;
  retryCount: typeof MESSAGE_FIELD_IDS.retryCount;
}

/**
 * Type for common timestamp fields across all entities
 */
export interface CommonTimestampFields {
  createdAt: TribFieldId;
  updatedAt: TribFieldId;
}

/**
 * Type for common metadata fields across all entities
 */
export interface CommonMetadataFields {
  metadata: TribFieldId;
}

/**
 * Type utility to check if a field ID belongs to a specific entity
 */
export type IsEntityFieldId<
  TFieldId extends TribFieldId,
  TEntity extends TribEntityType,
> = TFieldId extends TribEntityFieldIdMap[TEntity] ? true : false;

/**
 * Type utility to get entity type from field ID
 */
export type GetEntityTypeFromFieldId<TFieldId extends TribFieldId> =
  TFieldId extends MessageFieldId
    ? 'MESSAGE'
    : TFieldId extends ThreadFieldId
      ? 'THREAD'
      : TFieldId extends ConsentFieldId
        ? 'CONSENT'
        : TFieldId extends PhoneNumberFieldId
          ? 'PHONE_NUMBER'
          : TFieldId extends DeliveryFieldId
            ? 'DELIVERY'
            : never;

/**
 * Type for field ID lookup functions
 */
export interface TribFieldIdLookup {
  getFieldName: (fieldId: TribFieldId) => TribFieldName | undefined;
  getEntityType: (fieldId: TribFieldId) => TribEntityType | undefined;
  getFieldId: (
    entityType: TribEntityType,
    fieldName: string,
  ) => TribFieldId | undefined;
  validateFieldId: (fieldId: string) => TribFieldIdValidationResult;
  parseFieldId: (fieldId: string) => TribFieldIdParseResult | null;
}

/**
 * Type for field ID registry
 */
export interface TribFieldIdRegistry {
  readonly constants: TribFieldIdsConstant;
  readonly types: {
    MessageFieldId: MessageFieldId;
    ThreadFieldId: ThreadFieldId;
    ConsentFieldId: ConsentFieldId;
    PhoneNumberFieldId: PhoneNumberFieldId;
    DeliveryFieldId: DeliveryFieldId;
    TribFieldId: TribFieldId;
  };
  readonly lookup: TribFieldIdLookup;
  readonly metadata: TribFieldIdMetadata;
}

/**
 * Re-export all field ID constants for convenience
 */
export {
  MESSAGE_FIELD_IDS,
  THREAD_FIELD_IDS,
  CONSENT_FIELD_IDS,
  PHONE_NUMBER_FIELD_IDS,
  DELIVERY_FIELD_IDS,
  TRIB_FIELD_IDS,
};

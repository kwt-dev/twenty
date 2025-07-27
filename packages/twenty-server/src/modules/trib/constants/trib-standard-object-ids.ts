/**
 * TRIB Standard Object IDs
 * These constants define the standard object identifiers used across the TRIB Messages Module
 * Following Twenty CRM convention with static RFC 4122 UUIDs
 * 
 * /!\ DO NOT EDIT THE IDS OF THIS FILE /!\
 * These ids are used to identify standard objects in the database and compare them even when renamed.
 */

// Message-related object IDs
export const TRIB_MESSAGE_OBJECT_IDS = Object.freeze({
  /** SMS Message object */
  SMS_MESSAGE: '20202020-1a2b-4c3d-8e9f-123456789abc',
  /** Email Message object */
  EMAIL_MESSAGE: '20202020-2b3c-4d5e-9f1a-234567890bcd',
  /** WhatsApp Message object */
  WHATSAPP_MESSAGE: '20202020-3c4d-5e6f-1a2b-345678901cde',
  /** Generic Message Thread object */
  MESSAGE_THREAD: '20202020-4d5e-6f7a-2b3c-456789012def',
  /** Message Template object */
  MESSAGE_TEMPLATE: '20202020-5e6f-7a8b-3c4d-567890123ef0',
  /** Message Attachment object */
  MESSAGE_ATTACHMENT: '20202020-6f7a-8b9c-4d5e-678901234f01',
} as const);

// Phone Number-related object IDs
export const TRIB_PHONE_NUMBER_OBJECT_IDS = {
  /** Phone Number object */
  PHONE_NUMBER: '20202020-7a8b-9c0d-5e6f-789012345012',
} as const;

// Delivery-related object IDs
export const TRIB_DELIVERY_OBJECT_IDS = {
  /** Delivery tracking object */
  DELIVERY: '20202020-8b9c-0d1e-6f7a-890123456123',
} as const;

// Contact-related object IDs
export const TRIB_CONTACT_OBJECT_IDS = {
  /** Contact Person object */
  CONTACT_PERSON: '20202020-9c0d-1e2f-7a8b-901234567234',
  /** Contact Company object */
  CONTACT_COMPANY: '20202020-0d1e-2f3a-8b9c-012345678345',
  /** Contact Phone number object */
  CONTACT_PHONE: '20202020-1e2f-3a4b-9c0d-123456789456',
  /** Contact Email address object */
  CONTACT_EMAIL: '20202020-2f3a-4b5c-0d1e-234567890567',
  /** Contact Address object */
  CONTACT_ADDRESS: '20202020-3a4b-5c6d-1e2f-345678901678',
  /** Contact Thread object */
  CONTACT_THREAD: '20202020-4b5c-6d7e-2f3a-456789012789',
  /** TRIB Message Participant bridge object */
  TRIB_MESSAGE_PARTICIPANT: '20202020-5c6d-7e8f-3a4b-567890123890',
} as const;

// Consent-related object IDs
export const TRIB_CONSENT_OBJECT_IDS = {
  /** TCPA Consent object */
  TCPA_CONSENT: '20202020-5a6b-4c7d-8e9f-567890123456',
  /** Consent Audit object */
  CONSENT_AUDIT: '20202020-5a6b-4c7d-8e9f-567890123457',
  /** Consent Preference object */
  CONSENT_PREFERENCE: '20202020-5a6b-4c7d-8e9f-567890123458',
} as const;

// Integration-related object IDs
export const TRIB_INTEGRATION_OBJECT_IDS = {
  /** API Integration object */
  API_INTEGRATION: '20202020-6b7c-4d8e-9f0a-678901234567',
  /** Webhook Integration object */
  WEBHOOK_INTEGRATION: '20202020-6b7c-4d8e-9f0a-678901234568',
  /** Calendar Integration object */
  CALENDAR_INTEGRATION: '20202020-6b7c-4d8e-9f0a-678901234569',
  /** Email Provider Integration object */
  EMAIL_PROVIDER_INTEGRATION: '20202020-6b7c-4d8e-9f0a-67890123456a',
  /** SMS Provider Integration object */
  SMS_PROVIDER_INTEGRATION: '20202020-6b7c-4d8e-9f0a-67890123456b',
} as const;

// Workflow-related object IDs
export const TRIB_WORKFLOW_OBJECT_IDS = {
  /** Workflow Definition object */
  WORKFLOW_DEFINITION: '20202020-7c8d-4e9f-0a1b-789012345678',
  /** Workflow Execution object */
  WORKFLOW_EXECUTION: '20202020-7c8d-4e9f-0a1b-789012345679',
  /** Workflow Step object */
  WORKFLOW_STEP: '20202020-7c8d-4e9f-0a1b-78901234567a',
  /** Workflow Trigger object */
  WORKFLOW_TRIGGER: '20202020-7c8d-4e9f-0a1b-78901234567b',
  /** Workflow Action object */
  WORKFLOW_ACTION: '20202020-7c8d-4e9f-0a1b-78901234567c',
} as const;

// System-related object IDs
export const TRIB_SYSTEM_OBJECT_IDS = {
  /** User object */
  USER: '20202020-8d9e-4f0a-1b2c-890123456789',
  /** Role object */
  ROLE: '20202020-8d9e-4f0a-1b2c-89012345678a',
  /** Permission object */
  PERMISSION: '20202020-8d9e-4f0a-1b2c-89012345678b',
  /** Workspace object */
  WORKSPACE: '20202020-8d9e-4f0a-1b2c-89012345678c',
  /** Workspace Member object */
  WORKSPACE_MEMBER: '20202020-8d9e-4f0a-1b2c-89012345678d',
  /** Audit Log object */
  AUDIT_LOG: '20202020-8d9e-4f0a-1b2c-89012345678e',
  /** Configuration object */
  CONFIGURATION: '20202020-8d9e-4f0a-1b2c-89012345678f',
} as const;

// Export all object IDs as a single constant
export const TRIB_STANDARD_OBJECT_IDS = {
  ...TRIB_MESSAGE_OBJECT_IDS,
  ...TRIB_PHONE_NUMBER_OBJECT_IDS,
  ...TRIB_DELIVERY_OBJECT_IDS,
  ...TRIB_CONTACT_OBJECT_IDS,
  ...TRIB_CONSENT_OBJECT_IDS,
  ...TRIB_INTEGRATION_OBJECT_IDS,
  ...TRIB_WORKFLOW_OBJECT_IDS,
  ...TRIB_SYSTEM_OBJECT_IDS,
} as const;

// Type definitions for object IDs
export type TribMessageObjectId =
  (typeof TRIB_MESSAGE_OBJECT_IDS)[keyof typeof TRIB_MESSAGE_OBJECT_IDS];
export type TribPhoneNumberObjectId =
  (typeof TRIB_PHONE_NUMBER_OBJECT_IDS)[keyof typeof TRIB_PHONE_NUMBER_OBJECT_IDS];
export type TribDeliveryObjectId =
  (typeof TRIB_DELIVERY_OBJECT_IDS)[keyof typeof TRIB_DELIVERY_OBJECT_IDS];
export type TribContactObjectId =
  (typeof TRIB_CONTACT_OBJECT_IDS)[keyof typeof TRIB_CONTACT_OBJECT_IDS];
export type TribConsentObjectId =
  (typeof TRIB_CONSENT_OBJECT_IDS)[keyof typeof TRIB_CONSENT_OBJECT_IDS];
export type TribIntegrationObjectId =
  (typeof TRIB_INTEGRATION_OBJECT_IDS)[keyof typeof TRIB_INTEGRATION_OBJECT_IDS];
export type TribWorkflowObjectId =
  (typeof TRIB_WORKFLOW_OBJECT_IDS)[keyof typeof TRIB_WORKFLOW_OBJECT_IDS];
export type TribSystemObjectId =
  (typeof TRIB_SYSTEM_OBJECT_IDS)[keyof typeof TRIB_SYSTEM_OBJECT_IDS];

export type TribStandardObjectId =
  | TribMessageObjectId
  | TribPhoneNumberObjectId
  | TribDeliveryObjectId
  | TribContactObjectId
  | TribConsentObjectId
  | TribIntegrationObjectId
  | TribWorkflowObjectId
  | TribSystemObjectId;

// Helper function to get object ID by name
export function getTribObjectId(
  objectName: keyof typeof TRIB_STANDARD_OBJECT_IDS,
): string {
  return TRIB_STANDARD_OBJECT_IDS[objectName];
}

// Helper function to validate if an ID is a valid TRIB standard object ID
export function isValidTribStandardObjectId(id: string): boolean {
  return Object.values(TRIB_STANDARD_OBJECT_IDS).includes(
    id as TribStandardObjectId,
  );
}

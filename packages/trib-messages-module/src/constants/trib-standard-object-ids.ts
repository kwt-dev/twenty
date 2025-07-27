import { generateTribUuid } from '../utils/uuid-generator';

/**
 * TRIB Standard Object IDs
 * These constants define the standard object identifiers used across the TRIB Messages Module
 * Following the Twenty CRM convention with 20202020-XXXX pattern
 */

// Message-related object IDs
export const TRIB_MESSAGE_OBJECT_IDS = Object.freeze({
  /** SMS Message object */
  SMS_MESSAGE: generateTribUuid('MSG', 1),
  /** Email Message object */
  EMAIL_MESSAGE: generateTribUuid('MSG', 2),
  /** WhatsApp Message object */
  WHATSAPP_MESSAGE: generateTribUuid('MSG', 3),
  /** Generic Message Thread object */
  MESSAGE_THREAD: generateTribUuid('MSG', 4),
  /** Message Template object */
  MESSAGE_TEMPLATE: generateTribUuid('MSG', 5),
  /** Message Attachment object */
  MESSAGE_ATTACHMENT: generateTribUuid('MSG', 6),
} as const);

// Phone Number-related object IDs
export const TRIB_PHONE_NUMBER_OBJECT_IDS = {
  /** Phone Number object */
  PHONE_NUMBER: generateTribUuid('PHN', 1),
} as const;

// Delivery-related object IDs
export const TRIB_DELIVERY_OBJECT_IDS = {
  /** Delivery tracking object */
  DELIVERY: generateTribUuid('DLV', 1),
} as const;

// Contact-related object IDs
export const TRIB_CONTACT_OBJECT_IDS = {
  /** Contact Person object */
  CONTACT_PERSON: generateTribUuid('CNT', 1),
  /** Contact Company object */
  CONTACT_COMPANY: generateTribUuid('CNT', 2),
  /** Contact Phone number object */
  CONTACT_PHONE: generateTribUuid('CNT', 3),
  /** Contact Email address object */
  CONTACT_EMAIL: generateTribUuid('CNT', 4),
  /** Contact Address object */
  CONTACT_ADDRESS: generateTribUuid('CNT', 5),
  /** Contact Thread object */
  CONTACT_THREAD: generateTribUuid('CNT', 6),
} as const;

// Consent-related object IDs
export const TRIB_CONSENT_OBJECT_IDS = {
  /** TCPA Consent object */
  TCPA_CONSENT: generateTribUuid('CST', 1),
  /** Consent Audit object */
  CONSENT_AUDIT: generateTribUuid('CST', 2),
  /** Consent Preference object */
  CONSENT_PREFERENCE: generateTribUuid('CST', 3),
} as const;

// Integration-related object IDs
export const TRIB_INTEGRATION_OBJECT_IDS = {
  /** API Integration object */
  API_INTEGRATION: generateTribUuid('INT', 1),
  /** Webhook Integration object */
  WEBHOOK_INTEGRATION: generateTribUuid('INT', 2),
  /** Calendar Integration object */
  CALENDAR_INTEGRATION: generateTribUuid('INT', 3),
  /** Email Provider Integration object */
  EMAIL_PROVIDER_INTEGRATION: generateTribUuid('INT', 4),
  /** SMS Provider Integration object */
  SMS_PROVIDER_INTEGRATION: generateTribUuid('INT', 5),
} as const;

// Workflow-related object IDs
export const TRIB_WORKFLOW_OBJECT_IDS = {
  /** Workflow Definition object */
  WORKFLOW_DEFINITION: generateTribUuid('WFL', 1),
  /** Workflow Execution object */
  WORKFLOW_EXECUTION: generateTribUuid('WFL', 2),
  /** Workflow Step object */
  WORKFLOW_STEP: generateTribUuid('WFL', 3),
  /** Workflow Trigger object */
  WORKFLOW_TRIGGER: generateTribUuid('WFL', 4),
  /** Workflow Action object */
  WORKFLOW_ACTION: generateTribUuid('WFL', 5),
} as const;

// System-related object IDs
export const TRIB_SYSTEM_OBJECT_IDS = {
  /** User object */
  USER: generateTribUuid('USR', 1),
  /** Role object */
  ROLE: generateTribUuid('USR', 2),
  /** Permission object */
  PERMISSION: generateTribUuid('USR', 3),
  /** Workspace object */
  WORKSPACE: generateTribUuid('WKS', 1),
  /** Workspace Member object */
  WORKSPACE_MEMBER: generateTribUuid('WKS', 2),
  /** Audit Log object */
  AUDIT_LOG: generateTribUuid('SYS', 1),
  /** Configuration object */
  CONFIGURATION: generateTribUuid('SYS', 2),
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

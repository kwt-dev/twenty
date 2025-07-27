import { generateTribUuid } from '../utils/uuid-generator';

/**
 * TRIB Standard Field IDs
 *
 * This file contains comprehensive field ID constants for all TRIB entities.
 * Field IDs follow the pattern: 20202020-EEFF-XXXX-YYYY-ZZZZZZZZZZZZ
 * Where:
 * - EEFF: Entity range (01XX-05XX)
 * - XXXX: Field index within entity
 * - YYYY-ZZZZZZZZZZZZ: Random UUID suffix
 *
 * Entity Ranges:
 * - Message: 0100-0199
 * - Thread: 0200-0299
 * - Consent: 0300-0399
 * - PhoneNumber: 0400-0499
 * - Delivery: 0500-0599
 */

// Message Entity Field IDs (01XX range)
export const MESSAGE_FIELD_IDS = {
  /**
   * Message ID - Primary identifier for message records
   */
  id: generateTribUuid('MSG', 1),

  /**
   * Message content/body text
   */
  content: generateTribUuid('MSG', 2),

  /**
   * Message status (sent, delivered, failed, etc.)
   */
  status: generateTribUuid('MSG', 3),

  /**
   * Message type (SMS, MMS, etc.)
   */
  type: generateTribUuid('MSG', 4),

  /**
   * Sender phone number
   */
  from: generateTribUuid('MSG', 5),

  /**
   * Recipient phone number
   */
  to: generateTribUuid('MSG', 6),

  /**
   * Message timestamp (when sent)
   */
  timestamp: generateTribUuid('MSG', 7),

  /**
   * Thread ID (foreign key to Thread entity)
   */
  threadId: generateTribUuid('MSG', 8),

  /**
   * Delivery ID (foreign key to Delivery entity)
   */
  deliveryId: generateTribUuid('MSG', 9),

  /**
   * Message direction (inbound/outbound)
   */
  direction: generateTribUuid('MSG', 10),

  /**
   * Message priority level
   */
  priority: generateTribUuid('MSG', 11),

  /**
   * Message metadata (JSON field)
   */
  metadata: generateTribUuid('MSG', 12),

  /**
   * Created timestamp
   */
  createdAt: generateTribUuid('MSG', 13),

  /**
   * Updated timestamp
   */
  updatedAt: generateTribUuid('MSG', 14),

  /**
   * Error code for enhanced error tracking
   */
  errorCode: generateTribUuid('MSG', 15),

  /**
   * Error message for enhanced error tracking
   */
  errorMessage: generateTribUuid('MSG', 16),

  /**
   * Retry count for failed messages
   */
  retryCount: generateTribUuid('MSG', 17),

  /**
   * External provider message ID
   */
  externalId: generateTribUuid('MSG', 18),

  /**
   * Message size in bytes
   */
  messageSize: generateTribUuid('MSG', 19),

  /**
   * Message encoding type
   */
  encoding: generateTribUuid('MSG', 20),

  /**
   * Contact person ID (foreign key to Person entity)
   */
  contact: generateTribUuid('MSG', 21),
} as const;

// Thread Entity Field IDs (02XX range)
export const THREAD_FIELD_IDS = {
  /**
   * Thread ID - Primary identifier for thread records
   */
  id: generateTribUuid('THR', 201),

  /**
   * Thread subject/title
   */
  subject: generateTribUuid('THR', 202),

  /**
   * Thread participants (JSON array)
   */
  participants: generateTribUuid('THR', 203),

  /**
   * Thread status (active, archived, etc.)
   */
  status: generateTribUuid('THR', 204),

  /**
   * Thread type (SMS, group, etc.)
   */
  type: generateTribUuid('THR', 205),

  /**
   * Thread priority level
   */
  priority: generateTribUuid('THR', 206),

  /**
   * Thread metadata (JSON field)
   */
  metadata: generateTribUuid('THR', 207),

  /**
   * Created timestamp
   */
  createdAt: generateTribUuid('THR', 208),

  /**
   * Updated timestamp
   */
  updatedAt: generateTribUuid('THR', 209),

  /**
   * Last message timestamp
   */
  lastMessageAt: generateTribUuid('THR', 210),

  /**
   * Total message count in thread
   */
  messageCount: generateTribUuid('THR', 211),

  /**
   * Thread tags (JSON array)
   */
  tags: generateTribUuid('THR', 212),

  /**
   * Thread archived status
   */
  archived: generateTribUuid('THR', 213),

  /**
   * Thread read status
   */
  readStatus: generateTribUuid('THR', 214),

  /**
   * Thread owner/creator
   */
  owner: generateTribUuid('THR', 215),
} as const;

// Consent Entity Field IDs (03XX range)
export const CONSENT_FIELD_IDS = {
  /**
   * Consent ID - Primary identifier for consent records
   */
  id: generateTribUuid('CNT', 301),

  /**
   * Phone number for consent
   */
  phoneNumber: generateTribUuid('CNT', 302),

  /**
   * Consent status (granted, revoked, pending)
   */
  status: generateTribUuid('CNT', 303),

  /**
   * Consent type (marketing, transactional, etc.)
   */
  type: generateTribUuid('CNT', 304),

  /**
   * Consent source (web, SMS, API, etc.)
   */
  source: generateTribUuid('CNT', 305),

  /**
   * Consent timestamp
   */
  timestamp: generateTribUuid('CNT', 306),

  /**
   * Consent expiry date
   */
  expiryDate: generateTribUuid('CNT', 307),

  /**
   * Consent metadata (JSON field)
   */
  metadata: generateTribUuid('CNT', 308),

  /**
   * Created timestamp
   */
  createdAt: generateTribUuid('CNT', 309),

  /**
   * Updated timestamp
   */
  updatedAt: generateTribUuid('CNT', 310),

  /**
   * Consent version/revision
   */
  version: generateTribUuid('CNT', 311),

  /**
   * Legal basis for consent
   */
  legalBasis: generateTribUuid('CNT', 312),

  /**
   * Consent preferences (JSON object)
   */
  preferences: generateTribUuid('CNT', 313),

  /**
   * Consent audit trail (JSON array)
   */
  auditTrail: generateTribUuid('CNT', 314),

  /**
   * Consent verification status
   */
  verified: generateTribUuid('CNT', 315),
} as const;

// PhoneNumber Entity Field IDs (04XX range)
export const PHONE_NUMBER_FIELD_IDS = {
  /**
   * Phone Number ID - Primary identifier for phone number records
   */
  id: generateTribUuid('PHN', 401),

  /**
   * Phone number in E.164 format
   */
  number: generateTribUuid('PHN', 402),

  /**
   * Phone number type (mobile, landline, etc.)
   */
  type: generateTribUuid('PHN', 403),

  /**
   * Phone number status (active, inactive, etc.)
   */
  status: generateTribUuid('PHN', 404),

  /**
   * Country code
   */
  countryCode: generateTribUuid('PHN', 405),

  /**
   * Carrier information
   */
  carrier: generateTribUuid('PHN', 406),

  /**
   * Phone number metadata (JSON field)
   */
  metadata: generateTribUuid('PHN', 407),

  /**
   * Created timestamp
   */
  createdAt: generateTribUuid('PHN', 408),

  /**
   * Updated timestamp
   */
  updatedAt: generateTribUuid('PHN', 409),

  /**
   * Phone number validation status
   */
  validated: generateTribUuid('PHN', 410),

  /**
   * Phone number capabilities (SMS, MMS, Voice)
   */
  capabilities: generateTribUuid('PHN', 411),

  /**
   * Phone number region/area
   */
  region: generateTribUuid('PHN', 412),

  /**
   * Phone number timezone
   */
  timezone: generateTribUuid('PHN', 413),

  /**
   * Phone number display format
   */
  displayFormat: generateTribUuid('PHN', 414),

  /**
   * Phone number verification method
   */
  verificationMethod: generateTribUuid('PHN', 415),
} as const;

// Delivery Entity Field IDs (05XX range)
export const DELIVERY_FIELD_IDS = {
  /**
   * Delivery ID - Primary identifier for delivery records
   */
  id: generateTribUuid('DLV', 501),

  /**
   * Message ID (foreign key to Message entity)
   */
  messageId: generateTribUuid('DLV', 502),

  /**
   * Delivery status (pending, sent, delivered, failed)
   */
  status: generateTribUuid('DLV', 503),

  /**
   * Delivery timestamp
   */
  timestamp: generateTribUuid('DLV', 504),

  /**
   * Delivery provider (Twilio, AWS SNS, etc.)
   */
  provider: generateTribUuid('DLV', 505),

  /**
   * Delivery attempt count
   */
  attempts: generateTribUuid('DLV', 506),

  /**
   * Delivery error code
   */
  errorCode: generateTribUuid('DLV', 507),

  /**
   * Delivery error message
   */
  errorMessage: generateTribUuid('DLV', 508),

  /**
   * Delivery metadata (JSON field)
   */
  metadata: generateTribUuid('DLV', 509),

  /**
   * Created timestamp
   */
  createdAt: generateTribUuid('DLV', 510),

  /**
   * Updated timestamp
   */
  updatedAt: generateTribUuid('DLV', 511),

  /**
   * Delivery cost/pricing
   */
  cost: generateTribUuid('DLV', 512),

  /**
   * Delivery latency in milliseconds
   */
  latency: generateTribUuid('DLV', 513),

  /**
   * Delivery webhook URL
   */
  webhookUrl: generateTribUuid('DLV', 514),

  /**
   * Delivery callback status
   */
  callbackStatus: generateTribUuid('DLV', 515),

  /**
   * External provider delivery ID
   */
  externalDeliveryId: generateTribUuid('DLV', 516),
} as const;

// Combined field IDs for all TRIB entities
export const TRIB_FIELD_IDS = {
  MESSAGE: MESSAGE_FIELD_IDS,
  THREAD: THREAD_FIELD_IDS,
  CONSENT: CONSENT_FIELD_IDS,
  PHONE_NUMBER: PHONE_NUMBER_FIELD_IDS,
  DELIVERY: DELIVERY_FIELD_IDS,
} as const;

// Export individual field ID collections for convenience
export {
  MESSAGE_FIELD_IDS as MESSAGE_FIELDS,
  THREAD_FIELD_IDS as THREAD_FIELDS,
  CONSENT_FIELD_IDS as CONSENT_FIELDS,
  PHONE_NUMBER_FIELD_IDS as PHONE_NUMBER_FIELDS,
  DELIVERY_FIELD_IDS as DELIVERY_FIELDS,
};

/**
 * TRIB Standard Field IDs
 *
 * /!\ DO NOT EDIT THE IDS OF THIS FILE /!\
 * This file contains static ids for TRIB standard fields.
 * These ids are used to identify standard fields in the database and compare them even when renamed.
 * For readability keys can be edited but the values should not be changed.
 *
 * Field IDs follow Twenty's standard pattern: 20202020-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

// Message Entity Field IDs
export const MESSAGE_FIELD_IDS = {
  /**
   * Message content/body text
   */
  content: '20202020-f001-4a1b-8c2d-3e4f5a6b7c8d',

  /**
   * Message status (sent, delivered, failed, etc.)
   */
  status: '20202020-f002-4a1b-8c2d-3e4f5a6b7c8e',

  /**
   * Message type/channel (SMS, MMS, Email, etc.)
   */
  type: '20202020-f003-4a1b-8c2d-3e4f5a6b7c8f',

  /**
   * Message direction (inbound/outbound)
   */
  direction: '20202020-f004-4a1b-8c2d-3e4f5a6b7c90',

  /**
   * Sender identifier (phone/email)
   */
  from: '20202020-f005-4a1b-8c2d-3e4f5a6b7c91',

  /**
   * Recipient identifier (phone/email)
   */
  to: '20202020-f006-4a1b-8c2d-3e4f5a6b7c92',

  /**
   * Message timestamp (when sent)
   */
  timestamp: '20202020-f007-4a1b-8c2d-3e4f5a6b7c93',

  /**
   * External provider message ID
   */
  externalId: '20202020-f008-4a1b-8c2d-3e4f5a6b7c94',

  /**
   * Message priority level
   */
  priority: '20202020-f009-4a1b-8c2d-3e4f5a6b7c95',

  /**
   * Message metadata (JSON)
   */
  metadata: '20202020-f010-4a1b-8c2d-3e4f5a6b7c96',

  /**
   * Error code for failed messages
   */
  errorCode: '20202020-f011-4a1b-8c2d-3e4f5a6b7c97',

  /**
   * Error message description
   */
  errorMessage: '20202020-f012-4a1b-8c2d-3e4f5a6b7c98',

  /**
   * Retry count for failed messages
   */
  retryCount: '20202020-f013-4a1b-8c2d-3e4f5a6b7c99',

  /**
   * Message size in bytes
   */
  messageSize: '20202020-f014-4a1b-8c2d-3e4f5a6b7c9a',

  /**
   * Message encoding type
   */
  encoding: '20202020-f015-4a1b-8c2d-3e4f5a6b7c9b',

  /**
   * Related contact person ID
   */
  contact: '20202020-f016-4a1b-8c2d-3e4f5a6b7c9c',

  /**
   * Thread ID (foreign key to Thread entity)
   */
  threadId: '20202020-f017-4a1b-8c2d-3e4f5a6b7c9d',

  /**
   * Delivery tracking ID
   */
  deliveryId: '20202020-f018-4a1b-8c2d-3e4f5a6b7c9e',

  /**
   * Message participants relation (ONE_TO_MANY)
   */
  messageParticipants: '20202020-f019-4a1b-8c2d-3e4f5a6b7c9f',
};

/**
 * Thread field IDs
 * Field IDs for TribThread entity following Twenty's UUID v4 pattern
 */
export const THREAD_FIELD_IDS = {
  /**
   * Thread subject/title
   */
  subject: '20202020-a001-4a1b-8c2d-3e4f5a6b7c8d',

  /**
   * Thread status
   */
  status: '20202020-a002-4a1b-8c2d-3e4f5a6b7c8e',

  /**
   * Thread type
   */
  type: '20202020-a003-4a1b-8c2d-3e4f5a6b7c8f',

  /**
   * Thread priority
   */
  priority: '20202020-a004-4a1b-8c2d-3e4f5a6b7c90',

  /**
   * Participant phone numbers array
   */
  participants: '20202020-a005-4a1b-8c2d-3e4f5a6b7c91',

  /**
   * Message count
   */
  messageCount: '20202020-a006-4a1b-8c2d-3e4f5a6b7c92',

  /**
   * Last message timestamp
   */
  lastMessageAt: '20202020-a007-4a1b-8c2d-3e4f5a6b7c93',

  /**
   * Messages relation (ONE_TO_MANY)
   */
  messages: '20202020-a008-4a1b-8c2d-3e4f5a6b7c94',

  /**
   * Primary contact relation (MANY_TO_ONE)
   */
  primaryContact: '20202020-a009-4a1b-8c2d-3e4f5a6b7c95',

  /**
   * Primary contact ID
   */
  primaryContactId: '20202020-a010-4a1b-8c2d-3e4f5a6b7c96',

  /**
   * Thread tags
   */
  tags: '20202020-a011-4a1b-8c2d-3e4f5a6b7c97',

  /**
   * Thread notes
   */
  notes: '20202020-a012-4a1b-8c2d-3e4f5a6b7c98',

  /**
   * Thread metadata
   */
  metadata: '20202020-a013-4a1b-8c2d-3e4f5a6b7c99',

  /**
   * Thread archived status
   */
  archived: '20202020-a014-4a1b-8c2d-3e4f5a6b7c9a',

  /**
   * Thread read status
   */
  readStatus: '20202020-a015-4a1b-8c2d-3e4f5a6b7c9b',

  /**
   * Thread owner/creator
   */
  owner: '20202020-a016-4a1b-8c2d-3e4f5a6b7c9c',

  /**
   * Thread ID - Primary identifier
   */
  id: '20202020-a017-4a1b-8c2d-3e4f5a6b7c9d',
};

/**
 * Phone Number field IDs
 * Field IDs for TribPhoneNumber entity following Twenty's UUID v4 pattern
 */
export const PHONE_NUMBER_FIELD_IDS = {
  /**
   * Phone number in E.164 format (+1234567890)
   */
  number: '20202020-9001-4a1b-8c2d-3e4f5a6b7c8d',

  /**
   * Phone number type (MOBILE, LANDLINE, TOLL_FREE, SHORT_CODE, VOIP)
   */
  type: '20202020-9002-4a1b-8c2d-3e4f5a6b7c8e',

  /**
   * Phone number operational status
   */
  status: '20202020-9003-4a1b-8c2d-3e4f5a6b7c8f',

  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  countryCode: '20202020-9004-4a1b-8c2d-3e4f5a6b7c90',

  /**
   * Carrier/operator information
   */
  carrier: '20202020-9005-4a1b-8c2d-3e4f5a6b7c91',

  /**
   * Provider-specific capabilities (SMS, MMS, Voice)
   */
  capabilities: '20202020-9006-4a1b-8c2d-3e4f5a6b7c92',

  /**
   * Geographic region/area
   */
  region: '20202020-9007-4a1b-8c2d-3e4f5a6b7c93',

  /**
   * Timezone identifier (America/New_York)
   */
  timezone: '20202020-9008-4a1b-8c2d-3e4f5a6b7c94',

  /**
   * Formatted display version of phone number
   */
  displayFormat: '20202020-9009-4a1b-8c2d-3e4f5a6b7c95',

  /**
   * Phone number validation status
   */
  validated: '20202020-900a-4a1b-8c2d-3e4f5a6b7c96',

  /**
   * Verification method used
   */
  verificationMethod: '20202020-900b-4a1b-8c2d-3e4f5a6b7c97',

  /**
   * Provider-specific metadata (JSON)
   */
  metadata: '20202020-900c-4a1b-8c2d-3e4f5a6b7c98',
};

/**
 * CONSENT_FIELD_IDS - Standard field IDs for TribConsent entity
 * RFC 4122 compliant UUIDs for consent field definitions
 */
export const CONSENT_FIELD_IDS = {
  phoneNumber: '20202020-c001-4a1b-8c2d-3e4f5a6b7c01',
  status: '20202020-c002-4a1b-8c2d-3e4f5a6b7c02',
  source: '20202020-c003-4a1b-8c2d-3e4f5a6b7c03',
  type: '20202020-c004-4a1b-8c2d-3e4f5a6b7c04',
  timestamp: '20202020-c005-4a1b-8c2d-3e4f5a6b7c05',
  expiryDate: '20202020-c006-4a1b-8c2d-3e4f5a6b7c06',
  verified: '20202020-c007-4a1b-8c2d-3e4f5a6b7c07',
  verificationMethod: '20202020-c014-4a1b-8c2d-3e4f5a6b7c14',
  legalBasis: '20202020-c008-4a1b-8c2d-3e4f5a6b7c08',
  version: '20202020-c009-4a1b-8c2d-3e4f5a6b7c09',
  metadata: '20202020-c010-4a1b-8c2d-3e4f5a6b7c10',
  auditTrail: '20202020-c011-4a1b-8c2d-3e4f5a6b7c11',
  id: '20202020-c012-4a1b-8c2d-3e4f5a6b7c12',
  contact: '20202020-c013-4a1b-8c2d-3e4f5a6b7c13',
};

/**
 * DELIVERY_FIELD_IDS - Standard field IDs for TribDelivery entity
 * RFC 4122 compliant UUIDs for delivery field definitions
 */
export const DELIVERY_FIELD_IDS = {
  messageId: '20202020-d001-4a1b-8c2d-3e4f5a6b7c01',
  status: '20202020-d002-4a1b-8c2d-3e4f5a6b7c02',
  timestamp: '20202020-d003-4a1b-8c2d-3e4f5a6b7c03',
  provider: '20202020-d004-4a1b-8c2d-3e4f5a6b7c04',
  attempts: '20202020-d005-4a1b-8c2d-3e4f5a6b7c05',
  errorCode: '20202020-d006-4a1b-8c2d-3e4f5a6b7c06',
  errorMessage: '20202020-d007-4a1b-8c2d-3e4f5a6b7c07',
  cost: '20202020-d008-4a1b-8c2d-3e4f5a6b7c08',
  latency: '20202020-d009-4a1b-8c2d-3e4f5a6b7c09',
  webhookUrl: '20202020-d010-4a1b-8c2d-3e4f5a6b7c10',
  callbackStatus: '20202020-d011-4a1b-8c2d-3e4f5a6b7c11',
  externalDeliveryId: '20202020-d012-4a1b-8c2d-3e4f5a6b7c12',
  metadata: '20202020-d013-4a1b-8c2d-3e4f5a6b7c13',
};

/**
 * TRIB_MESSAGE_PARTICIPANT_FIELD_IDS - Standard field IDs for TribMessageParticipant entity
 * RFC 4122 compliant UUIDs for message participant field definitions
 * Bridge entity linking Person records to SMS messages
 */
export const TRIB_MESSAGE_PARTICIPANT_FIELD_IDS = {
  /**
   * Participant role (from/to)
   */
  role: '20202020-9001-4a1b-8c2d-3e4f5a6b7c8d',

  /**
   * Phone number of the participant
   */
  phoneNumber: '20202020-9002-4a1b-8c2d-3e4f5a6b7c8e',

  /**
   * Related person entity (many-to-one)
   */
  person: '20202020-9003-4a1b-8c2d-3e4f5a6b7c8f',

  /**
   * Related TRIB message entity (many-to-one)
   */
  tribMessage: '20202020-9004-4a1b-8c2d-3e4f5a6b7c80',
};
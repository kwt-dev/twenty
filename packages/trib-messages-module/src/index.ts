/**
 * TRIB Messages Module - Package Foundation
 *
 * This module provides the foundation for the TRIB (Twenty Record Integration Bridge) Messages Module.
 * It includes constants, utilities, and type definitions for integrating messaging functionality
 * with the Twenty CRM system.
 */

// Export UUID utilities
export {
  generateTribUuid,
  isValidTribUuid,
  parseTribUuid,
} from './utils/uuid-generator';

// Export standard object IDs
export {
  TRIB_MESSAGE_OBJECT_IDS,
  TRIB_CONTACT_OBJECT_IDS,
  TRIB_CONSENT_OBJECT_IDS,
  TRIB_INTEGRATION_OBJECT_IDS,
  TRIB_WORKFLOW_OBJECT_IDS,
  TRIB_SYSTEM_OBJECT_IDS,
  TRIB_STANDARD_OBJECT_IDS,
  getTribObjectId,
  isValidTribStandardObjectId,
} from './constants/trib-standard-object-ids';

// Export message enums
export {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
  isValidTribMessageStatus,
  isValidTribMessageDirection,
  isValidTribMessageChannel,
  isValidTribMessagePriority,
  isValidTribMessageEncoding,
  isValidStatusTransition,
  isTerminalStatus,
  isRetryableFailure,
} from './types/message-enums';

// Export thread enums
export {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
  isValidTribThreadStatus,
  isValidTribThreadType,
  isValidTribThreadPriority,
  isValidThreadStatusTransition,
  canReceiveMessages,
  canSendMessages,
  isTerminalThreadStatus,
} from './types/thread-enums';

// Export consent enums
export {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
  isConsentStatus,
  isConsentSource,
  isConsentType,
  isConsentVerificationMethod,
  isLegalBasis,
  isValidConsentTransition,
  VALID_CONSENT_TRANSITIONS,
  CONSENT_ENUMS,
} from './types/consent-enums';

// Export delivery enums
export {
  TribDeliveryStatus,
  TribDeliveryPriority,
} from './types/delivery-enums';

// Export field IDs
export {
  MESSAGE_FIELD_IDS,
  THREAD_FIELD_IDS,
  CONSENT_FIELD_IDS,
  PHONE_NUMBER_FIELD_IDS,
  DELIVERY_FIELD_IDS,
  TRIB_FIELD_IDS,
  MESSAGE_FIELDS,
  THREAD_FIELDS,
  CONSENT_FIELDS,
  PHONE_NUMBER_FIELDS,
  DELIVERY_FIELDS,
} from './constants/trib-standard-field-ids';

// Export validators
export {
  validateThreadStatus,
  validateThreadSubject,
  validateThreadParticipants,
  validateThreadTags,
  validateMessageCount,
  validateThreadMetadata,
} from './utils/validation/thread-validator';

export {
  validateConsentStatus,
  validatePhoneNumber,
  validateConsentSource,
  validateConsentDates,
  validateConsentTransition,
  validateConsentRecord,
  validateConsentMetadata,
  getValidConsentTransitions,
  isConsentExpired,
  consentValidator,
} from './utils/validation/consent-validator';

// Export DTOs
export { CreateSmsMessageDto, TwilioConfigDto } from './dto/create-message.dto';

// Export services
export { TribSmsService } from './services/trib_sms.service';
export { TwilioApiClientService } from './services/twilio-api-client.service';
export { SmsStatusUpdaterService } from './services/sms-status-updater.service';
export { SmsRateLimiterService } from './services/sms-rate-limiter.service';

// Export processors
export { SmsQueueProcessor } from './processors/sms-queue.processor';

// Export controllers
export { TribWebhookController } from './controllers/trib-webhook.controller';

// Export middleware
export { TwilioSignatureValidationMiddleware } from './middleware/twilio-signature-validation.middleware';

// Export utilities
export { TwilioResponseTransformerService } from './utils/twilio/response-transformer';
export { RateLimitCalculatorService } from './utils/rate-limiting/rate-limit-calculator';
export { RateLimitKeyGeneratorService } from './utils/rate-limiting/rate-limit-key-generator';

// Export phone utilities for SMS matching
export { 
  normalizePhoneNumber, 
  getPhoneVariations, 
  arePhoneNumbersEqual 
} from './utils/phone/phone-normalizer';

// Export configuration
export { getSmsQueueConfig } from './config/sms-queue.config';
export { SMS_QUEUE_NAMES } from './constants/sms-queue.constants';

// Export tokens and providers for integration (Slice 4)
export { TRIB_TOKENS } from './tokens';
export { DefaultRedisClientService } from './providers/default-redis-client';
export { DefaultMessageQueueService } from './providers/default-message-queue-service';
export { DefaultMessageRepository } from './providers/default-message-repository';
export { DefaultTribDeliveryRepository } from './providers/default-delivery-repository';

// Export repository interfaces
export type {
  ITribMessageRepository,
  TribMessage,
} from './interfaces/trib-message.repository.interface';
export type {
  ITribDeliveryRepository,
  TribDelivery,
} from './interfaces/trib-delivery.repository.interface';
export type {
  IPersonRepository,
  PersonPhone,
} from './interfaces/person.repository.interface';

// Export module
export { TribMessagesModule } from './trib-messages.module';

// Export types
export type {
  TribMessageObjectId,
  TribContactObjectId,
  TribConsentObjectId,
  TribIntegrationObjectId,
  TribWorkflowObjectId,
  TribSystemObjectId,
  TribStandardObjectId,
} from './constants/trib-standard-object-ids';

export type {
  ConsentDates,
  ConsentRecord,
  ConsentValidationResult,
} from './utils/validation/consent-validator';

export type {
  RateLimitConfig,
  WorkspaceRateLimitTier,
} from './utils/rate-limiting/rate-limit-calculator';

export type { RateLimitKeyOptions } from './utils/rate-limiting/rate-limit-key-generator';

export type {
  TwilioApiResult,
  TwilioError,
  TwilioErrorType,
} from './types/twilio-types';

export type {
  SmsQueueJobData,
  SendSmsJobData,
  SmsProcessorJobResult,
  SmsQueueJobName,
} from './types/queue-job-types';

export { SMS_QUEUE_JOBS } from './types/queue-job-types';

// Export service interfaces for integration (Slice 4)
export type { IRedisClientService } from './services/sms-rate-limiter.service';
export type { IMessageQueueService } from './providers/default-message-queue-service';

// Package metadata
export const TRIB_PACKAGE_INFO = Object.freeze({
  name: '@twenty/trib-messages-module',
  version: '1.0.0',
  description:
    'TRIB (Twenty Record Integration Bridge) Messages Module Package Foundation',
} as const);

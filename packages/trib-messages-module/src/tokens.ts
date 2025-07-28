/**
 * Dependency Injection Tokens for TribMessagesModule
 *
 * These tokens enable loose coupling and prevent circular dependencies
 * by allowing service interfaces to be injected instead of concrete implementations.
 */

// Redis client service token
export const TRIB_REDIS_CLIENT = Symbol('TRIB_REDIS_CLIENT');

// Message queue service token
export const TRIB_MESSAGE_QUEUE_SERVICE = Symbol('TRIB_MESSAGE_QUEUE_SERVICE');

// Logger service token
export const TRIB_LOGGER = Symbol('TRIB_LOGGER');

// Queue name constant
export const TRIB_QUEUE_NAME = 'trib-messages';

// Repository tokens for complete DI abstraction (following circular dependency fix pattern)
export const TRIB_MESSAGE_REPOSITORY = Symbol('TRIB_MESSAGE_REPOSITORY');
export const TRIB_THREAD_REPOSITORY = Symbol('TRIB_THREAD_REPOSITORY');
export const TRIB_CONSENT_REPOSITORY = Symbol('TRIB_CONSENT_REPOSITORY');
export const TRIB_DELIVERY_REPOSITORY = Symbol('TRIB_DELIVERY_REPOSITORY');
export const TRIB_PHONE_NUMBER_REPOSITORY = Symbol(
  'TRIB_PHONE_NUMBER_REPOSITORY',
);
export const TRIB_PERSON_REPOSITORY = Symbol('TRIB_PERSON_REPOSITORY');
export const TRIB_MESSAGE_PARTICIPANT_REPOSITORY = Symbol(
  'TRIB_MESSAGE_PARTICIPANT_REPOSITORY',
);

// Twenty server integration tokens
export const TRIB_WORKSPACE_EVENT_EMITTER = Symbol('TRIB_WORKSPACE_EVENT_EMITTER');
export const TRIB_OBJECT_METADATA_REPOSITORY = Symbol('TRIB_OBJECT_METADATA_REPOSITORY');

/**
 * Centralized token definitions to prevent string literal drift
 * and ensure consistency across the module.
 */
export const TRIB_TOKENS = {
  REDIS_CLIENT: TRIB_REDIS_CLIENT,
  MESSAGE_QUEUE_SERVICE: TRIB_MESSAGE_QUEUE_SERVICE,
  LOGGER: TRIB_LOGGER,
  QUEUE_NAME: TRIB_QUEUE_NAME,
  // Repository tokens for complete DI abstraction
  MESSAGE_REPOSITORY: TRIB_MESSAGE_REPOSITORY,
  THREAD_REPOSITORY: TRIB_THREAD_REPOSITORY,
  CONSENT_REPOSITORY: TRIB_CONSENT_REPOSITORY,
  DELIVERY_REPOSITORY: TRIB_DELIVERY_REPOSITORY,
  PHONE_NUMBER_REPOSITORY: TRIB_PHONE_NUMBER_REPOSITORY,
  PERSON_REPOSITORY: TRIB_PERSON_REPOSITORY,
  MESSAGE_PARTICIPANT_REPOSITORY: TRIB_MESSAGE_PARTICIPANT_REPOSITORY,
  // Twenty server integration tokens
  WORKSPACE_EVENT_EMITTER: TRIB_WORKSPACE_EVENT_EMITTER,
  OBJECT_METADATA_REPOSITORY: TRIB_OBJECT_METADATA_REPOSITORY,
} as const;

/**
 * Type definitions for injected services
 */
export type TribTokens = typeof TRIB_TOKENS;

/**
 * Re-export interface from rate limiter service for convenience
 */
export type { IRedisClientService } from './services/sms-rate-limiter.service';

/**
 * DEPRECATED: Legacy token exports for backward compatibility
 *
 * These exports are deprecated and will be removed in a future version.
 * Please use TRIB_TOKENS.* pattern instead.
 *
 * Migration guide:
 * - MESSAGE_QUEUE_SERVICE_TOKEN → TRIB_TOKENS.MESSAGE_QUEUE_SERVICE
 */
export const MESSAGE_QUEUE_SERVICE_TOKEN = TRIB_TOKENS.MESSAGE_QUEUE_SERVICE;

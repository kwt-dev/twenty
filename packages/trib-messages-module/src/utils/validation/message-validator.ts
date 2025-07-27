import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
  isValidStatusTransition,
  isValidTribMessageStatus,
  isValidTribMessageDirection,
  isValidTribMessageChannel,
  isValidTribMessagePriority,
  isValidTribMessageEncoding,
} from '../../types/message-enums';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Message content validation constraints
 */
export const MESSAGE_VALIDATION_CONSTRAINTS = {
  SMS_MAX_LENGTH: 1600, // Max length for SMS (concatenated)
  MMS_MAX_SIZE: 5 * 1024 * 1024, // 5MB max for MMS
  MIN_CONTENT_LENGTH: 1,
  MAX_CONTENT_LENGTH: 10000,
  PHONE_NUMBER_REGEX: /^\+[1-9]\d{0,14}$/,
  EMAIL_REGEX: /^[^\s@]+(?:\.[^\s@]+)*@[^\s@]+(?:\.[^\s@]+)+$/,
} as const;

/**
 * Validates message content based on channel type
 */
export function validateMessageContent(
  content: string,
  channel: TribMessageChannel = TribMessageChannel.SMS,
): ValidationResult {
  const errors: string[] = [];

  // Basic content validation
  if (!content || content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  }

  if (content.length < MESSAGE_VALIDATION_CONSTRAINTS.MIN_CONTENT_LENGTH) {
    errors.push(
      `Message content must be at least ${MESSAGE_VALIDATION_CONSTRAINTS.MIN_CONTENT_LENGTH} character(s)`,
    );
  }

  if (content.length > MESSAGE_VALIDATION_CONSTRAINTS.MAX_CONTENT_LENGTH) {
    errors.push(
      `Message content cannot exceed ${MESSAGE_VALIDATION_CONSTRAINTS.MAX_CONTENT_LENGTH} characters`,
    );
  }

  // Channel-specific validation
  switch (channel) {
    case TribMessageChannel.SMS:
      if (content.length > MESSAGE_VALIDATION_CONSTRAINTS.SMS_MAX_LENGTH) {
        errors.push(
          `SMS content cannot exceed ${MESSAGE_VALIDATION_CONSTRAINTS.SMS_MAX_LENGTH} characters`,
        );
      }
      break;
    case TribMessageChannel.MMS:
      // Additional MMS-specific validation would go here
      break;
    case TribMessageChannel.EMAIL:
      // Additional email-specific validation would go here
      break;
    case TribMessageChannel.WHATSAPP:
      // Additional WhatsApp-specific validation would go here
      break;
    case TribMessageChannel.VOICE:
      // Voice messages have different content requirements
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  const errors: string[] = [];

  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push('Phone number cannot be empty');
  }

  if (!MESSAGE_VALIDATION_CONSTRAINTS.PHONE_NUMBER_REGEX.test(phoneNumber)) {
    errors.push('Phone number must be in E.164 format (e.g., +1234567890)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email address format
 */
export function validateEmailAddress(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email address cannot be empty');
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    errors.push('Invalid email address format');
  }

  if (!MESSAGE_VALIDATION_CONSTRAINTS.EMAIL_REGEX.test(email)) {
    errors.push('Invalid email address format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message status transition
 */
export function validateStatusTransition(
  currentStatus: TribMessageStatus,
  newStatus: TribMessageStatus,
): ValidationResult {
  const errors: string[] = [];

  if (!isValidTribMessageStatus(currentStatus)) {
    errors.push(`Invalid current status: ${currentStatus}`);
  }

  if (!isValidTribMessageStatus(newStatus)) {
    errors.push(`Invalid new status: ${newStatus}`);
  }

  if (
    errors.length === 0 &&
    !isValidStatusTransition(currentStatus, newStatus)
  ) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message direction
 */
export function validateMessageDirection(direction: string): ValidationResult {
  const errors: string[] = [];

  if (!isValidTribMessageDirection(direction)) {
    errors.push(
      `Invalid message direction: ${direction}. Must be one of: ${Object.values(
        TribMessageDirection,
      ).join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message channel
 */
export function validateMessageChannel(channel: string): ValidationResult {
  const errors: string[] = [];

  if (!isValidTribMessageChannel(channel)) {
    errors.push(
      `Invalid message channel: ${channel}. Must be one of: ${Object.values(
        TribMessageChannel,
      ).join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message priority
 */
export function validateMessagePriority(priority: string): ValidationResult {
  const errors: string[] = [];

  if (!isValidTribMessagePriority(priority)) {
    errors.push(
      `Invalid message priority: ${priority}. Must be one of: ${Object.values(
        TribMessagePriority,
      ).join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message encoding
 */
export function validateMessageEncoding(encoding: string): ValidationResult {
  const errors: string[] = [];

  if (!isValidTribMessageEncoding(encoding)) {
    errors.push(
      `Invalid message encoding: ${encoding}. Must be one of: ${Object.values(
        TribMessageEncoding,
      ).join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates retry count
 */
export function validateRetryCount(retryCount: number): ValidationResult {
  const errors: string[] = [];

  const MAX_RETRY_COUNT = 5;

  if (retryCount < 0) {
    errors.push('Retry count cannot be negative');
  }

  if (retryCount > MAX_RETRY_COUNT) {
    errors.push(`Retry count cannot exceed ${MAX_RETRY_COUNT}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates message size in bytes
 */
export function validateMessageSize(size: number): ValidationResult {
  const errors: string[] = [];

  if (size < 0) {
    errors.push('Message size cannot be negative');
  }

  if (size > MESSAGE_VALIDATION_CONSTRAINTS.MMS_MAX_SIZE) {
    errors.push(
      `Message size cannot exceed ${MESSAGE_VALIDATION_CONSTRAINTS.MMS_MAX_SIZE} bytes`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive message validation
 * Validates all aspects of a message object
 */
export function validateTribMessage(message: {
  content: string;
  channel: string;
  direction: string;
  from: string;
  to: string;
  priority?: string;
  encoding?: string;
  retryCount?: number;
  messageSize?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate content
  const contentResult = validateMessageContent(
    message.content,
    message.channel as TribMessageChannel,
  );
  errors.push(...contentResult.errors);

  // Validate direction
  const directionResult = validateMessageDirection(message.direction);
  errors.push(...directionResult.errors);

  // Validate channel
  const channelResult = validateMessageChannel(message.channel);
  errors.push(...channelResult.errors);

  // Validate phone numbers or email addresses based on channel
  if (
    message.channel === TribMessageChannel.SMS ||
    message.channel === TribMessageChannel.MMS
  ) {
    const fromResult = validatePhoneNumber(message.from);
    errors.push(...fromResult.errors.map((error) => `From phone: ${error}`));

    const toResult = validatePhoneNumber(message.to);
    errors.push(...toResult.errors.map((error) => `To phone: ${error}`));
  } else if (message.channel === TribMessageChannel.EMAIL) {
    const fromResult = validateEmailAddress(message.from);
    errors.push(...fromResult.errors.map((error) => `From email: ${error}`));

    const toResult = validateEmailAddress(message.to);
    errors.push(...toResult.errors.map((error) => `To email: ${error}`));
  }

  // Validate optional fields
  if (message.priority) {
    const priorityResult = validateMessagePriority(message.priority);
    errors.push(...priorityResult.errors);
  }

  if (message.encoding) {
    const encodingResult = validateMessageEncoding(message.encoding);
    errors.push(...encodingResult.errors);
  }

  if (message.retryCount !== undefined) {
    const retryResult = validateRetryCount(message.retryCount);
    errors.push(...retryResult.errors);
  }

  if (message.messageSize !== undefined) {
    const sizeResult = validateMessageSize(message.messageSize);
    errors.push(...sizeResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

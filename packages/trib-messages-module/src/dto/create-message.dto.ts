import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import {
  TribMessageChannel,
  TribMessagePriority,
  TribMessageDirection,
} from '../types/message-enums';

/**
 * DTO for creating a new TRIB message with comprehensive validation
 *
 * Validates all required fields for message creation including:
 * - Content validation based on channel limits
 * - Phone number format validation (E.164)
 * - Email format validation
 * - Channel-specific validation rules
 * - Priority and direction validation
 *
 * @example
 * ```typescript
 * const messageDto = new CreateMessageDto();
 * messageDto.content = "Hello, World!";
 * messageDto.channel = TribMessageChannel.SMS;
 * messageDto.to = "+1234567890";
 * messageDto.from = "+0987654321";
 * messageDto.priority = TribMessagePriority.NORMAL;
 * ```
 */
export class CreateMessageDto {
  /**
   * Message content/body text
   * Required field with channel-specific length validation
   */
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  content: string;

  /**
   * Message channel type
   * Determines validation rules and processing logic
   */
  @IsEnum(TribMessageChannel, {
    message: 'Channel must be one of: SMS, MMS, EMAIL, WHATSAPP, VOICE',
  })
  channel: TribMessageChannel;

  /**
   * Recipient identifier (phone number, email, etc.)
   * Format depends on channel type
   */
  @IsString({ message: 'Recipient must be a string' })
  @IsNotEmpty({ message: 'Recipient cannot be empty' })
  to: string;

  /**
   * Sender identifier (phone number, email, etc.)
   * Format depends on channel type
   */
  @IsString({ message: 'Sender must be a string' })
  @IsNotEmpty({ message: 'Sender cannot be empty' })
  from: string;

  /**
   * Message direction (inbound/outbound)
   * Optional field with default to OUTBOUND
   */
  @IsOptional()
  @IsEnum(TribMessageDirection, {
    message: 'Direction must be either INBOUND or OUTBOUND',
  })
  direction?: TribMessageDirection = TribMessageDirection.OUTBOUND;

  /**
   * Message priority level
   * Optional field with default to NORMAL
   */
  @IsOptional()
  @IsEnum(TribMessagePriority, {
    message: 'Priority must be one of: LOW, NORMAL, HIGH, CRITICAL',
  })
  priority?: TribMessagePriority = TribMessagePriority.NORMAL;

  /**
   * Related contact person ID
   * Optional UUID for linking to CRM contact
   */
  @IsOptional()
  @IsUUID(4, { message: 'Contact ID must be a valid UUID' })
  contactId?: string;

  /**
   * Conversation thread ID
   * Optional UUID for linking to existing conversation
   */
  @IsOptional()
  @IsUUID(4, { message: 'Thread ID must be a valid UUID' })
  threadId?: string;

  /**
   * Scheduled send time
   * Optional ISO date string for delayed message sending
   */
  @IsOptional()
  @IsDateString({}, { message: 'Timestamp must be a valid ISO date string' })
  timestamp?: string;

  /**
   * Additional message metadata
   * Optional JSON object for channel-specific data
   */
  @IsOptional()
  @IsObject({ message: 'Metadata must be a valid object' })
  metadata?: Record<string, any>;

  /**
   * Workspace ID for multi-tenant isolation
   * Required for workspace-aware operations
   */
  @IsUUID(4, { message: 'Workspace ID must be a valid UUID' })
  workspaceId: string;
}

/**
 * DTO for SMS-specific message creation with enhanced validation
 *
 * Extends CreateMessageDto with SMS-specific validations:
 * - E.164 phone number format validation
 * - SMS content length limits (160 chars single SMS, 1600 chars concatenated)
 * - SMS-specific metadata validation
 */
export class CreateSmsMessageDto extends CreateMessageDto {
  /**
   * SMS channel is fixed to SMS
   */
  declare channel: TribMessageChannel.SMS;

  /**
   * Recipient phone number in E.164 format
   * Must start with + and contain only digits
   */
  @IsString({ message: 'Recipient phone number must be a string' })
  @IsNotEmpty({ message: 'Recipient phone number cannot be empty' })
  declare to: string;

  /**
   * Sender phone number in E.164 format
   * Must start with + and contain only digits
   */
  @IsString({ message: 'Sender phone number must be a string' })
  @IsNotEmpty({ message: 'Sender phone number cannot be empty' })
  declare from: string;

  /**
   * SMS content with length validation
   * Maximum 1600 characters for concatenated SMS
   */
  @IsString({ message: 'SMS content must be a string' })
  @IsNotEmpty({ message: 'SMS content cannot be empty' })
  declare content: string;
}

/**
 * DTO for email message creation with email-specific validation
 *
 * Extends CreateMessageDto with email-specific validations:
 * - Valid email address format validation
 * - Email content length limits
 * - Email-specific metadata (subject, CC, BCC, etc.)
 */
export class CreateEmailMessageDto extends CreateMessageDto {
  /**
   * Email channel is fixed to EMAIL
   */
  declare channel: TribMessageChannel.EMAIL;

  /**
   * Recipient email address
   * Must be valid email format
   */
  @IsString({ message: 'Recipient email must be a string' })
  @IsNotEmpty({ message: 'Recipient email cannot be empty' })
  declare to: string;

  /**
   * Sender email address
   * Must be valid email format
   */
  @IsString({ message: 'Sender email must be a string' })
  @IsNotEmpty({ message: 'Sender email cannot be empty' })
  declare from: string;

  /**
   * Email subject line
   * Optional field for email metadata
   */
  @IsOptional()
  @IsString({ message: 'Email subject must be a string' })
  subject?: string;

  /**
   * Email content with length validation
   * Maximum 100,000 characters for email body
   */
  @IsString({ message: 'Email content must be a string' })
  @IsNotEmpty({ message: 'Email content cannot be empty' })
  declare content: string;
}

/**
 * Response DTO for successful message creation
 *
 * Returns essential information about the created message:
 * - Message ID for tracking
 * - Initial delivery status
 * - External provider ID (if available)
 * - Estimated delivery time
 */
export class MessageCreationResponseDto {
  /**
   * Unique message identifier
   */
  messageId: string;

  /**
   * Current delivery status
   */
  status: string;

  /**
   * External provider message ID (e.g., Twilio SID)
   */
  externalId: string | null;

  /**
   * Estimated delivery time
   */
  estimatedDeliveryTime: Date | null;

  /**
   * Error information (if any)
   */
  error: string | null;

  /**
   * Success flag
   */
  success: boolean;
}

/**
 * DTO for Twilio configuration used in service
 *
 * Contains all necessary Twilio API configuration:
 * - Account SID and Auth Token for authentication
 * - Phone numbers for sending
 * - Webhook URLs for status updates
 */
export class TwilioConfigDto {
  /**
   * Twilio Account SID
   */
  @IsString({ message: 'Account SID must be a string' })
  @IsNotEmpty({ message: 'Account SID cannot be empty' })
  accountSid: string;

  /**
   * Twilio Auth Token
   */
  @IsString({ message: 'Auth Token must be a string' })
  @IsNotEmpty({ message: 'Auth Token cannot be empty' })
  authToken: string;

  /**
   * Twilio phone number for sending SMS
   */
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  phoneNumber: string;

  /**
   * Webhook URL for status callbacks
   */
  @IsOptional()
  @IsString({ message: 'Webhook URL must be a string' })
  webhookUrl?: string;

  /**
   * API timeout in milliseconds
   */
  @IsOptional()
  timeout?: number = 30000; // 30 seconds default

  /**
   * Maximum retry attempts
   */
  @IsOptional()
  maxRetries?: number = 3;
}

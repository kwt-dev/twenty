import { Logger } from '@nestjs/common';
import { TwilioConfigDto } from '../../dto/create-message.dto';

/**
 * Mock Twilio client interface for testing and development
 *
 * This interface represents the core Twilio functionality needed for SMS messaging.
 * In production, this would be replaced with the actual Twilio SDK client.
 *
 * @example
 * ```typescript
 * const client = createTwilioClient(config);
 * const message = await client.messages.create({
 *   body: "Hello World",
 *   from: "+1234567890",
 *   to: "+0987654321"
 * });
 * ```
 */
export interface TwilioClient {
  messages: {
    create(params: TwilioMessageParams): Promise<TwilioMessageResponse>;
    fetch(sid: string): Promise<TwilioMessageResponse>;
    list(options?: TwilioListOptions): Promise<TwilioMessageResponse[]>;
  };
  accountSid: string;
  authToken: string;
}

/**
 * Parameters for creating a Twilio message
 */
export interface TwilioMessageParams {
  /**
   * Message body content
   */
  body: string;

  /**
   * Sender phone number (E.164 format)
   */
  from: string;

  /**
   * Recipient phone number (E.164 format)
   */
  to: string;

  /**
   * Optional status callback URL for webhooks
   */
  statusCallback?: string;

  /**
   * Optional messaging service SID
   */
  messagingServiceSid?: string;

  /**
   * Optional media URLs for MMS
   */
  mediaUrl?: string[];

  /**
   * Optional validity period in seconds
   */
  validityPeriod?: number;
}

/**
 * Twilio message response structure
 */
export interface TwilioMessageResponse {
  /**
   * Unique message SID
   */
  sid: string;

  /**
   * Account SID
   */
  accountSid: string;

  /**
   * Message body
   */
  body: string;

  /**
   * Sender phone number
   */
  from: string;

  /**
   * Recipient phone number
   */
  to: string;

  /**
   * Message status
   */
  status: TwilioMessageStatus;

  /**
   * Direction (inbound/outbound)
   */
  direction: string;

  /**
   * Number of message segments
   */
  numSegments: string;

  /**
   * Price of the message
   */
  price?: string;

  /**
   * Price unit
   */
  priceUnit?: string;

  /**
   * Error code (if any)
   */
  errorCode?: string;

  /**
   * Error message (if any)
   */
  errorMessage?: string;

  /**
   * Date created
   */
  dateCreated: Date;

  /**
   * Date updated
   */
  dateUpdated: Date;

  /**
   * Date sent
   */
  dateSent?: Date;
}

/**
 * Twilio message status enumeration
 */
export enum TwilioMessageStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  UNDELIVERED = 'undelivered',
  FAILED = 'failed',
}

/**
 * Options for listing Twilio messages
 */
export interface TwilioListOptions {
  /**
   * Filter by phone number
   */
  from?: string;
  to?: string;

  /**
   * Filter by date range
   */
  dateSentAfter?: Date;
  dateSentBefore?: Date;

  /**
   * Pagination
   */
  limit?: number;
  pageSize?: number;
}

/**
 * Mock Twilio client implementation for testing and development
 *
 * This implementation provides a complete mock of Twilio's messaging API
 * for development and testing purposes. It includes:
 * - Realistic response generation
 * - Status progression simulation
 * - Error simulation capabilities
 * - Comprehensive logging
 */
class MockTwilioClient implements TwilioClient {
  private readonly logger = new Logger(MockTwilioClient.name);
  private messageStore = new Map<string, TwilioMessageResponse>();

  constructor(
    public readonly accountSid: string,
    public readonly authToken: string,
    private readonly config: TwilioConfigDto,
  ) {
    this.logger.log(
      `Mock Twilio client initialized for account: ${accountSid}`,
    );
  }

  messages = {
    create: async (
      params: TwilioMessageParams,
    ): Promise<TwilioMessageResponse> => {
      this.logger.log(`Creating message from ${params.from} to ${params.to}`);

      // Generate unique message SID
      const sid = `SM${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      // Simulate message creation
      const message: TwilioMessageResponse = {
        sid,
        accountSid: this.accountSid,
        body: params.body,
        from: params.from,
        to: params.to,
        status: TwilioMessageStatus.QUEUED,
        direction: 'outbound-api',
        numSegments: Math.ceil(params.body.length / 160).toString(),
        price: '-0.0075',
        priceUnit: 'USD',
        dateCreated: new Date(),
        dateUpdated: new Date(),
      };

      // Store message for future retrieval
      this.messageStore.set(sid, message);

      // Simulate status progression after a delay
      setTimeout(() => {
        this.simulateStatusProgression(sid);
      }, 1000);

      this.logger.log(`Message created with SID: ${sid}`);
      return message;
    },

    fetch: async (sid: string): Promise<TwilioMessageResponse> => {
      this.logger.log(`Fetching message with SID: ${sid}`);

      const message = this.messageStore.get(sid);
      if (!message) {
        throw new Error(`Message with SID ${sid} not found`);
      }

      return message;
    },

    list: async (
      options?: TwilioListOptions,
    ): Promise<TwilioMessageResponse[]> => {
      this.logger.log('Listing messages with options:', options);

      let messages = Array.from(this.messageStore.values());

      // Apply filters if provided
      if (options?.from) {
        messages = messages.filter((m) => m.from === options.from);
      }
      if (options?.to) {
        messages = messages.filter((m) => m.to === options.to);
      }
      if (options?.dateSentAfter) {
        messages = messages.filter(
          (m) => m.dateSent && m.dateSent >= options.dateSentAfter!,
        );
      }
      if (options?.dateSentBefore) {
        messages = messages.filter(
          (m) => m.dateSent && m.dateSent <= options.dateSentBefore!,
        );
      }

      // Apply pagination
      if (options?.limit) {
        messages = messages.slice(0, options.limit);
      }

      return messages;
    },
  };

  /**
   * Simulates realistic message status progression
   * @param sid - Message SID to update
   */
  private simulateStatusProgression(sid: string): void {
    const message = this.messageStore.get(sid);
    if (!message) {
      return;
    }

    // Simulate progression: QUEUED -> SENDING -> SENT -> DELIVERED
    if (message.status === TwilioMessageStatus.QUEUED) {
      message.status = TwilioMessageStatus.SENDING;
      message.dateUpdated = new Date();
      this.logger.log(`Message ${sid} status updated to: ${message.status}`);

      // Continue progression
      setTimeout(() => {
        this.simulateStatusProgression(sid);
      }, 2000);
    } else if (message.status === TwilioMessageStatus.SENDING) {
      message.status = TwilioMessageStatus.SENT;
      message.dateSent = new Date();
      message.dateUpdated = new Date();
      this.logger.log(`Message ${sid} status updated to: ${message.status}`);

      // Final progression to delivered
      setTimeout(() => {
        this.simulateStatusProgression(sid);
      }, 5000);
    } else if (message.status === TwilioMessageStatus.SENT) {
      // Simulate 95% delivery success rate
      if (Math.random() < 0.95) {
        message.status = TwilioMessageStatus.DELIVERED;
      } else {
        message.status = TwilioMessageStatus.UNDELIVERED;
        message.errorCode = '30008';
        message.errorMessage = 'Unknown error';
      }
      message.dateUpdated = new Date();
      this.logger.log(`Message ${sid} final status: ${message.status}`);
    }

    this.messageStore.set(sid, message);
  }
}

/**
 * Creates a Twilio client instance with proper configuration
 *
 * This factory function creates either a real Twilio client or a mock client
 * based on the environment configuration. It provides:
 * - Proper authentication setup
 * - Timeout configuration
 * - Retry logic setup
 * - Comprehensive error handling
 *
 * @param config - Twilio configuration object
 * @returns Configured Twilio client instance
 *
 * @example
 * ```typescript
 * const config = {
 *   accountSid: "AC1234567890",
 *   authToken: "your_auth_token",
 *   phoneNumber: "+1234567890",
 *   timeout: 30000,
 *   maxRetries: 3
 * };
 *
 * const client = createTwilioClient(config);
 * ```
 */
export function createTwilioClient(config: TwilioConfigDto): TwilioClient {
  const logger = new Logger('TwilioClientFactory');

  // Validate configuration
  if (!config.accountSid || !config.authToken) {
    throw new Error('Twilio Account SID and Auth Token are required');
  }

  if (!config.phoneNumber) {
    throw new Error('Twilio phone number is required');
  }

  // Validate phone number format (E.164)
  const e164Regex = /^\+[1-9]\d{0,14}$/;
  if (!e164Regex.test(config.phoneNumber)) {
    throw new Error(
      `Invalid phone number format: ${config.phoneNumber}. Must be E.164 format.`,
    );
  }

  // Set default values
  const timeout = config.timeout || 30000; // 30 seconds
  const maxRetries = config.maxRetries || 3;

  logger.log(`Creating Twilio client for account: ${config.accountSid}`);
  logger.log(
    `Configuration - Phone: ${config.phoneNumber}, Timeout: ${timeout}ms, Max Retries: ${maxRetries}`,
  );

  // For now, always return mock client for development/testing
  // In production, this would check environment variables to determine
  // whether to return a real Twilio client or mock client
  const useMockClient =
    process.env.NODE_ENV !== 'production' ||
    process.env.TWILIO_USE_MOCK === 'true';

  if (useMockClient) {
    logger.log('Using mock Twilio client for development/testing');
    return new MockTwilioClient(config.accountSid, config.authToken, config);
  }

  // Create real Twilio client for production
  try {
    const twilio = require('twilio');
    logger.log(`Creating real Twilio client for account: ${config.accountSid}`);
    
    return twilio(config.accountSid, config.authToken, {
      timeout: timeout,
      maxRetries: maxRetries,
    });
  } catch (error) {
    logger.error('Failed to create real Twilio client, falling back to mock:', error);
    logger.warn('Using mock Twilio client as fallback');
    return new MockTwilioClient(config.accountSid, config.authToken, config);
  }
}

/**
 * Validates Twilio configuration object
 *
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 * @throws Error with specific validation message if invalid
 */
export function validateTwilioConfig(config: TwilioConfigDto): boolean {
  if (!config) {
    throw new Error('Twilio configuration is required');
  }

  if (!config.accountSid || config.accountSid.trim().length === 0) {
    throw new Error('Twilio Account SID is required and cannot be empty');
  }

  if (!config.authToken || config.authToken.trim().length === 0) {
    throw new Error('Twilio Auth Token is required and cannot be empty');
  }

  if (!config.phoneNumber || config.phoneNumber.trim().length === 0) {
    throw new Error('Twilio phone number is required and cannot be empty');
  }

  // Validate Account SID format
  if (!config.accountSid.startsWith('AC') || config.accountSid.length !== 34) {
    throw new Error(
      "Invalid Twilio Account SID format. Must start with 'AC' and be 34 characters long.",
    );
  }

  // Validate phone number format (E.164)
  const e164Regex = /^\+[1-9]\d{0,14}$/;
  if (!e164Regex.test(config.phoneNumber)) {
    throw new Error(
      `Invalid phone number format: ${config.phoneNumber}. Must be E.164 format (e.g., +1234567890).`,
    );
  }

  // Validate timeout if provided
  if (
    config.timeout !== undefined &&
    (config.timeout <= 0 || config.timeout > 300000)
  ) {
    throw new Error('Timeout must be between 1ms and 300000ms (5 minutes)');
  }

  // Validate max retries if provided
  if (
    config.maxRetries !== undefined &&
    (config.maxRetries < 0 || config.maxRetries > 10)
  ) {
    throw new Error('Max retries must be between 0 and 10');
  }

  return true;
}

/**
 * Maps Twilio status to TRIB message status
 *
 * @param twilioStatus - Twilio message status
 * @returns Corresponding TRIB message status
 */
export function mapTwilioStatusToTribStatus(
  twilioStatus: TwilioMessageStatus,
): string {
  switch (twilioStatus) {
    case TwilioMessageStatus.QUEUED:
      return 'QUEUED';
    case TwilioMessageStatus.SENDING:
      return 'SENDING';
    case TwilioMessageStatus.SENT:
      return 'SENT';
    case TwilioMessageStatus.DELIVERED:
      return 'DELIVERED';
    case TwilioMessageStatus.UNDELIVERED:
      return 'UNDELIVERED';
    case TwilioMessageStatus.FAILED:
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}

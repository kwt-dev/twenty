import { z } from 'zod';

/**
 * Twilio SMS delivery status values
 */
export const TwilioSmsStatusSchema = z.enum([
  'queued',
  'sending',
  'sent',
  'delivered',
  'undelivered',
  'failed',
  'received',
]);

export type TwilioSmsStatus = z.infer<typeof TwilioSmsStatusSchema>;

/**
 * Twilio webhook payload validation schema
 * Handles both inbound (SmsStatus) and outbound (MessageStatus) webhook formats
 */
export const TwilioWebhookPayloadSchema = z
  .object({
    // Message identification
    MessageSid: z.string().min(1, 'MessageSid is required'),
    AccountSid: z.string().min(1, 'AccountSid is required'),

    // Message status - handles both field names used by Twilio
    MessageStatus: TwilioSmsStatusSchema.optional(), // Outbound webhooks
    SmsStatus: TwilioSmsStatusSchema.optional(), // Inbound webhooks

    // Phone numbers
    To: z.string().min(1, 'To phone number is required'),
    From: z.string().min(1, 'From phone number is required'),

    // Message content (optional in delivery status webhooks)
    Body: z.string().optional(),

    // Delivery details
    ErrorCode: z.string().optional(),
    ErrorMessage: z.string().optional(),

    // Timestamps
    DateCreated: z.string().optional(),
    DateUpdated: z.string().optional(),
    DateSent: z.string().optional(),

    // Pricing information (optional)
    Price: z.string().optional(),
    PriceUnit: z.string().optional(),

    // Additional webhook metadata
    Direction: z
      .enum(['inbound', 'outbound-api', 'outbound-call', 'outbound-reply'])
      .optional(),
    ApiVersion: z.string().optional(),
    Uri: z.string().optional(),

    // Custom parameters that may be included
    NumSegments: z.string().optional(),
    NumMedia: z.string().optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one status field is present
      return data.MessageStatus || data.SmsStatus;
    },
    {
      message: 'Either MessageStatus or SmsStatus is required',
      path: ['MessageStatus', 'SmsStatus'],
    },
  );

export type TwilioWebhookPayload = z.infer<typeof TwilioWebhookPayloadSchema>;

/**
 * Gets the status value from webhook payload, handling both field name variations
 */
export function getStatusFromWebhook(
  payload: TwilioWebhookPayload,
): TwilioSmsStatus {
  return payload.MessageStatus || payload.SmsStatus!;
}

/**
 * Webhook processing result
 */
export const WebhookProcessResultSchema = z.object({
  statusUpdated: z.boolean(),
  deliveryId: z.string(),
  previousStatus: z.string().optional(),
  newStatus: z.string(),
  processedAt: z.date(),
});

export type WebhookProcessResult = z.infer<typeof WebhookProcessResultSchema>;

/**
 * Webhook error response
 */
export const WebhookErrorResponseSchema = z.object({
  error: z.string(),
  httpStatus: z.number(),
  timestamp: z.date(),
  details: z.record(z.any()).optional(),
});

export type WebhookErrorResponse = z.infer<typeof WebhookErrorResponseSchema>;

/**
 * Maps Twilio SMS status to internal delivery status
 */
export function mapTwilioStatusToDeliveryStatus(
  twilioStatus: TwilioSmsStatus,
): string {
  const statusMap: Record<TwilioSmsStatus, string> = {
    queued: 'PENDING',
    sending: 'PENDING',
    sent: 'SENT',
    delivered: 'DELIVERED',
    undelivered: 'FAILED',
    failed: 'FAILED',
    received: 'DELIVERED', // For inbound messages
  };

  return statusMap[twilioStatus] || 'UNKNOWN';
}

/**
 * Validates if the webhook payload represents a delivery status update or inbound message
 */
export function isDeliveryStatusUpdate(payload: TwilioWebhookPayload): boolean {
  const status = getStatusFromWebhook(payload);
  const processableStatuses: TwilioSmsStatus[] = [
    'sent',
    'delivered',
    'undelivered',
    'failed',
    'received', // Include inbound messages
  ];
  return processableStatuses.includes(status);
}

/**
 * Extracts error information from failed delivery webhook
 */
export function extractErrorInfo(payload: TwilioWebhookPayload): {
  errorCode?: string;
  errorMessage?: string;
  hasError: boolean;
} {
  return {
    errorCode: payload.ErrorCode,
    errorMessage: payload.ErrorMessage,
    hasError: !!(payload.ErrorCode || payload.ErrorMessage),
  };
}

/**
 * Delivery Status Enums
 *
 * Defines status values for SMS delivery tracking.
 * Maps to Twilio delivery status webhooks and internal delivery tracking.
 */

export enum TribDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  UNDELIVERED = 'UNDELIVERED',
}

/**
 * Delivery Priority Enums
 *
 * Defines priority levels for message delivery.
 */
export enum TribDeliveryPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
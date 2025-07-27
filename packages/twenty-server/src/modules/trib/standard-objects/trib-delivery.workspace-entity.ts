import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { RelationOnDeleteAction } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-on-delete-action.interface';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

import { DELIVERY_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_DELIVERY_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import { isValidProvider } from '../utils/validation/provider-validator';
import { TribMessageWorkspaceEntity } from './trib-message.workspace-entity';

/**
 * Delivery status tracking for comprehensive message lifecycle
 * Aligned with provider status codes (Twilio, AWS SNS, etc.)
 */
export enum TribDeliveryStatus {
  QUEUED = 'QUEUED', // Message queued for delivery
  SENDING = 'SENDING', // Message being sent to provider
  SENT = 'SENT', // Message sent to recipient device
  DELIVERED = 'DELIVERED', // Message delivered to recipient
  FAILED = 'FAILED', // Message delivery failed
  UNDELIVERED = 'UNDELIVERED', // Message could not be delivered
  CANCELED = 'CANCELED', // Message delivery canceled
  ACCEPTED = 'ACCEPTED', // Message accepted by provider
  RECEIVING = 'RECEIVING', // Inbound message being processed
  RECEIVED = 'RECEIVED', // Inbound message received
}

/**
 * Callback/webhook processing status
 * Tracks webhook delivery and processing
 */
export enum TribCallbackStatus {
  PENDING = 'PENDING', // Webhook not yet processed
  PROCESSING = 'PROCESSING', // Webhook being processed
  COMPLETED = 'COMPLETED', // Webhook processed successfully
  FAILED = 'FAILED', // Webhook processing failed
  RETRYING = 'RETRYING', // Webhook being retried
  ABANDONED = 'ABANDONED', // Webhook retries exhausted
}

/**
 * TribDelivery WorkspaceEntity
 *
 * Comprehensive message delivery tracking with enhanced error handling
 * and debugging capabilities. Provides detailed lifecycle tracking for
 * all message deliveries across multiple providers.
 *
 * Features:
 * - Enhanced delivery status tracking with granular states
 * - Comprehensive error tracking with provider-specific codes
 * - Webhook processing and callback status management
 * - Performance monitoring with latency tracking
 * - Cost tracking and billing integration
 * - ONE_TO_ONE relationship with TribMessage
 * - Multi-provider support (Twilio, AWS SNS, Azure)
 *
 * @example
 * ```typescript
 * const delivery = new TribDeliveryWorkspaceEntity();
 * delivery.messageId = "msg-123";
 * delivery.status = TribDeliveryStatus.QUEUED;
 * delivery.provider = "TWILIO";
 * delivery.attempts = 1;
 * delivery.externalDeliveryId = "SM123abc";
 * ```
 */
@WorkspaceIsSystem()
@WorkspaceEntity({
  standardId: TRIB_DELIVERY_OBJECT_IDS.DELIVERY,
  namePlural: 'tribDeliveries',
  labelSingular: msg`TRIB Delivery`,
  labelPlural: msg`TRIB Deliveries`,
  description: msg`Message delivery tracking record with comprehensive status and error tracking`,
  icon: 'IconTruck',
  shortcut: 'D',
  labelIdentifierStandardId: DELIVERY_FIELD_IDS.externalDeliveryId,
})
export class TribDeliveryWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Message relationship
   * MANY_TO_ONE relationship with TribMessage
   * Multiple delivery records can track one message (for retry attempts)
   */
  @WorkspaceRelation({
    standardId: DELIVERY_FIELD_IDS.messageId,
    type: RelationType.MANY_TO_ONE,
    label: msg`Message`,
    description: msg`Message being tracked for delivery`,
    icon: 'IconMessage',
    inverseSideTarget: () => TribMessageWorkspaceEntity,
    inverseSideFieldKey: 'deliveries',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  @WorkspaceIsNullable()
  message: Relation<any>;

  /**
   * Message ID foreign key
   * Links delivery to specific message
   */
  @WorkspaceJoinColumn('message')
  messageId: string;

  /**
   * Delivery status with enhanced granular tracking
   * Comprehensive status covering entire delivery lifecycle
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Comprehensive delivery status`,
    icon: 'IconCheck',
    options: [
      { value: TribDeliveryStatus.QUEUED, label: 'Queued', color: 'blue', position: 0 },
      { value: TribDeliveryStatus.SENDING, label: 'Sending', color: 'yellow', position: 1 },
      { value: TribDeliveryStatus.SENT, label: 'Sent', color: 'green', position: 2 },
      {
        value: TribDeliveryStatus.DELIVERED,
        label: 'Delivered',
        color: 'green',
        position: 3,
      },
      { value: TribDeliveryStatus.FAILED, label: 'Failed', color: 'red', position: 4 },
      {
        value: TribDeliveryStatus.UNDELIVERED,
        label: 'Undelivered',
        color: 'orange',
        position: 5,
      },
      { value: TribDeliveryStatus.CANCELED, label: 'Canceled', color: 'gray', position: 6 },
      { value: TribDeliveryStatus.ACCEPTED, label: 'Accepted', color: 'blue', position: 7 },
      {
        value: TribDeliveryStatus.RECEIVING,
        label: 'Receiving',
        color: 'purple',
        position: 8,
      },
      { value: TribDeliveryStatus.RECEIVED, label: 'Received', color: 'green', position: 9 },
    ],
    defaultValue: `'${TribDeliveryStatus.QUEUED}'`,
  })
  status: TribDeliveryStatus;

  /**
   * Delivery timestamp
   * When the delivery status was last updated
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.timestamp,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Delivery Timestamp`,
    description: msg`When delivery status was last updated`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  timestamp: Date | null;

  /**
   * Message provider
   * Which service provider is handling the delivery
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.provider,
    type: FieldMetadataType.TEXT,
    label: msg`Provider`,
    description: msg`Message delivery provider (TWILIO, AWS_SNS, etc.)`,
    icon: 'IconCloud',
  })
  provider: string;

  /**
   * Delivery attempt count
   * Number of times delivery has been attempted
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.attempts,
    type: FieldMetadataType.NUMBER,
    label: msg`Attempts`,
    description: msg`Number of delivery attempts`,
    icon: 'IconRefresh',
    defaultValue: 0,
  })
  attempts: number;

  /**
   * Provider-specific error code
   * Error code returned by the delivery provider
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.errorCode,
    type: FieldMetadataType.TEXT,
    label: msg`Error Code`,
    description: msg`Provider-specific error code for failed deliveries`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  errorCode: string | null;

  /**
   * Detailed error message
   * Human-readable error description from provider
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.errorMessage,
    type: FieldMetadataType.TEXT,
    label: msg`Error Message`,
    description: msg`Detailed error message from provider`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  errorMessage: string | null;

  /**
   * Delivery cost tracking
   * Cost charged by provider for this delivery
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.cost,
    type: FieldMetadataType.NUMBER,
    label: msg`Cost`,
    description: msg`Delivery cost in cents (USD)`,
    icon: 'IconCoin',
  })
  @WorkspaceIsNullable()
  cost: number | null;

  /**
   * Delivery latency measurement
   * Time taken for delivery in milliseconds
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.latency,
    type: FieldMetadataType.NUMBER,
    label: msg`Latency (ms)`,
    description: msg`Delivery latency in milliseconds`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  latency: number | null;

  /**
   * Webhook URL for status updates
   * URL where provider sends delivery status callbacks
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.webhookUrl,
    type: FieldMetadataType.TEXT,
    label: msg`Webhook URL`,
    description: msg`URL for delivery status callbacks`,
    icon: 'IconWebhook',
  })
  @WorkspaceIsNullable()
  webhookUrl: string | null;

  /**
   * Callback processing status
   * Tracks webhook delivery and processing
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.callbackStatus,
    type: FieldMetadataType.SELECT,
    label: msg`Callback Status`,
    description: msg`Webhook processing status`,
    icon: 'IconWebhook',
    options: [
      { value: TribCallbackStatus.PENDING, label: 'Pending', color: 'blue', position: 0 },
      {
        value: TribCallbackStatus.PROCESSING,
        label: 'Processing',
        color: 'yellow',
        position: 1,
      },
      {
        value: TribCallbackStatus.COMPLETED,
        label: 'Completed',
        color: 'green',
        position: 2,
      },
      { value: TribCallbackStatus.FAILED, label: 'Failed', color: 'red', position: 3 },
      {
        value: TribCallbackStatus.RETRYING,
        label: 'Retrying',
        color: 'orange',
        position: 4,
      },
      {
        value: TribCallbackStatus.ABANDONED,
        label: 'Abandoned',
        color: 'gray',
        position: 5,
      },
    ],
    defaultValue: `'${TribCallbackStatus.PENDING}'`,
  })
  callbackStatus: TribCallbackStatus;

  /**
   * External provider delivery ID
   * Provider's unique identifier for this delivery
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.externalDeliveryId,
    type: FieldMetadataType.TEXT,
    label: msg`External Delivery ID`,
    description: msg`Provider delivery ID (e.g., Twilio SID)`,
    icon: 'IconExternalLink',
  })
  @WorkspaceIsNullable()
  externalDeliveryId: string | null;

  /**
   * Provider-specific metadata
   * JSON field for additional delivery data and debugging info
   */
  @WorkspaceField({
    standardId: DELIVERY_FIELD_IDS.metadata,
    type: FieldMetadataType.RAW_JSON,
    label: msg`Metadata`,
    description: msg`Provider-specific metadata and debugging information`,
    icon: 'IconCode',
  })
  @WorkspaceIsNullable()
  metadata: Record<string, any> | null;

  /**
   * Validates provider name
   * @param provider - Provider name to validate
   * @returns True if provider is supported
   */
  static validateProvider(provider: string): boolean {
    if (!provider || typeof provider !== 'string') {
      return false;
    }

    return isValidProvider(provider);
  }

  /**
   * Checks if delivery status is terminal
   * @param status - Delivery status to check
   * @returns True if status is final (no further updates expected)
   */
  static isTerminalStatus(status: TribDeliveryStatus): boolean {
    return [
      TribDeliveryStatus.DELIVERED,
      TribDeliveryStatus.FAILED,
      TribDeliveryStatus.CANCELED,
      TribDeliveryStatus.UNDELIVERED,
      TribDeliveryStatus.RECEIVED, // For inbound messages
    ].includes(status);
  }

  /**
   * Checks if delivery can be retried
   * @param status - Delivery status to check
   * @param attempts - Number of attempts made
   * @param maxAttempts - Maximum retry attempts (default: 3)
   * @returns True if delivery can be retried
   */
  static canRetry(
    status: TribDeliveryStatus,
    attempts: number,
    maxAttempts: number = 3,
  ): boolean {
    // Can't retry terminal successful states
    if (
      [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.RECEIVED,
        TribDeliveryStatus.CANCELED,
      ].includes(status)
    ) {
      return false;
    }

    // Can retry failed and undelivered if under max attempts
    if (
      [TribDeliveryStatus.FAILED, TribDeliveryStatus.UNDELIVERED].includes(
        status,
      )
    ) {
      return attempts < maxAttempts;
    }

    return false;
  }

  /**
   * Checks if delivery status indicates success
   * @param status - Delivery status to check
   * @returns True if status indicates successful delivery
   */
  static isSuccessfulDelivery(status: TribDeliveryStatus): boolean {
    return [TribDeliveryStatus.DELIVERED, TribDeliveryStatus.RECEIVED].includes(
      status,
    );
  }

  /**
   * Checks if delivery status indicates failure
   * @param status - Delivery status to check
   * @returns True if status indicates delivery failure
   */
  static isFailedDelivery(status: TribDeliveryStatus): boolean {
    return [TribDeliveryStatus.FAILED, TribDeliveryStatus.UNDELIVERED].includes(
      status,
    );
  }

  /**
   * Gets next valid status transitions
   * @param currentStatus - Current delivery status
   * @returns Array of valid next statuses
   */
  static getValidTransitions(
    currentStatus: TribDeliveryStatus,
  ): TribDeliveryStatus[] {
    const transitions: Record<TribDeliveryStatus, TribDeliveryStatus[]> = {
      [TribDeliveryStatus.QUEUED]: [
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.CANCELED,
        TribDeliveryStatus.FAILED,
      ],
      [TribDeliveryStatus.SENDING]: [
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.ACCEPTED,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.CANCELED,
      ],
      [TribDeliveryStatus.SENT]: [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.UNDELIVERED,
        TribDeliveryStatus.FAILED,
      ],
      [TribDeliveryStatus.ACCEPTED]: [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.UNDELIVERED,
      ],
      [TribDeliveryStatus.RECEIVING]: [
        TribDeliveryStatus.RECEIVED,
        TribDeliveryStatus.FAILED,
      ],
      [TribDeliveryStatus.DELIVERED]: [], // Terminal
      [TribDeliveryStatus.RECEIVED]: [], // Terminal
      [TribDeliveryStatus.FAILED]: [
        TribDeliveryStatus.QUEUED, // For retries
      ],
      [TribDeliveryStatus.UNDELIVERED]: [
        TribDeliveryStatus.QUEUED, // For retries
      ],
      [TribDeliveryStatus.CANCELED]: [], // Terminal
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Validates status transition
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns True if transition is valid
   */
  static isValidTransition(
    fromStatus: TribDeliveryStatus,
    toStatus: TribDeliveryStatus,
  ): boolean {
    const validTransitions = this.getValidTransitions(fromStatus);
    return validTransitions.includes(toStatus);
  }

  /**
   * Calculates delivery success rate
   * @param deliveries - Array of delivery statuses
   * @returns Success rate as percentage (0-100)
   */
  static calculateSuccessRate(deliveries: TribDeliveryStatus[]): number {
    if (deliveries.length === 0) {
      return 0;
    }

    const successfulCount = deliveries.filter((status) =>
      this.isSuccessfulDelivery(status),
    ).length;

    return Math.round((successfulCount / deliveries.length) * 100);
  }

  /**
   * Validates webhook URL format
   * @param url - Webhook URL to validate
   * @returns True if URL is valid HTTPS format
   */
  static validateWebhookUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const parsedUrl = new URL(url);

      // Must be HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Must have valid hostname (not empty, not just dots)
      if (
        !parsedUrl.hostname ||
        parsedUrl.hostname.length === 0 ||
        parsedUrl.hostname === '.' ||
        parsedUrl.hostname === '..' ||
        parsedUrl.hostname === '.com'
      ) {
        return false;
      }

      // Must have valid domain format (at least one char before and after dot)
      const domainParts = parsedUrl.hostname.split('.');
      if (
        domainParts.length < 2 ||
        domainParts.some((part) => part.length === 0)
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

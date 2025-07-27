/**
 * Enhanced message status enum with granular tracking for delivery pipeline
 * Follows Twilio SMS status patterns for compatibility
 */
export enum TribMessageStatus {
  /** Message created and queued for sending */
  QUEUED = 'queued',
  /** API call to provider initiated */
  SENDING = 'sending',
  /** Provider accepted the message */
  SENT = 'sent',
  /** Message successfully delivered to recipient */
  DELIVERED = 'delivered',
  /** Message failed to send via provider */
  FAILED = 'failed',
  /** Message sent but not delivered to recipient */
  UNDELIVERED = 'undelivered',
  /** Message was canceled before sending */
  CANCELED = 'canceled',
}

/**
 * Message direction enum
 */
export enum TribMessageDirection {
  /** Outbound message from system to recipient */
  OUTBOUND = 'outbound',
  /** Inbound message from recipient to system */
  INBOUND = 'inbound',
}

/**
 * Message channel/type enum
 */
export enum TribMessageChannel {
  /** SMS text message */
  SMS = 'sms',
  /** MMS multimedia message */
  MMS = 'mms',
  /** WhatsApp message */
  WHATSAPP = 'whatsapp',
  /** Email message */
  EMAIL = 'email',
  /** Voice call */
  VOICE = 'voice',
}

/**
 * Message priority levels
 */
export enum TribMessagePriority {
  /** Low priority - batch processing */
  LOW = 'low',
  /** Normal priority - standard processing */
  NORMAL = 'normal',
  /** High priority - expedited processing */
  HIGH = 'high',
  /** Critical priority - immediate processing */
  CRITICAL = 'critical',
}

/**
 * Message encoding types
 */
export enum TribMessageEncoding {
  /** UTF-8 encoding */
  UTF8 = 'utf8',
  /** ASCII encoding */
  ASCII = 'ascii',
  /** UCS-2 encoding (for Unicode characters) */
  UCS2 = 'ucs2',
  /** Latin-1 encoding */
  LATIN1 = 'latin1',
}

/**
 * Type guards for enum validation
 */
export function isValidTribMessageStatus(
  value: string,
): value is TribMessageStatus {
  return Object.values(TribMessageStatus).includes(value as TribMessageStatus);
}

export function isValidTribMessageDirection(
  value: string,
): value is TribMessageDirection {
  return Object.values(TribMessageDirection).includes(
    value as TribMessageDirection,
  );
}

export function isValidTribMessageChannel(
  value: string,
): value is TribMessageChannel {
  return Object.values(TribMessageChannel).includes(
    value as TribMessageChannel,
  );
}

export function isValidTribMessagePriority(
  value: string,
): value is TribMessagePriority {
  return Object.values(TribMessagePriority).includes(
    value as TribMessagePriority,
  );
}

export function isValidTribMessageEncoding(
  value: string,
): value is TribMessageEncoding {
  return Object.values(TribMessageEncoding).includes(
    value as TribMessageEncoding,
  );
}

/**
 * Status transition validation
 * Defines valid state transitions for message status
 */
export const VALID_STATUS_TRANSITIONS: Record<
  TribMessageStatus,
  TribMessageStatus[]
> = {
  [TribMessageStatus.QUEUED]: [
    TribMessageStatus.SENDING,
    TribMessageStatus.CANCELED,
  ],
  [TribMessageStatus.SENDING]: [
    TribMessageStatus.SENT,
    TribMessageStatus.FAILED,
  ],
  [TribMessageStatus.SENT]: [
    TribMessageStatus.DELIVERED,
    TribMessageStatus.UNDELIVERED,
  ],
  [TribMessageStatus.DELIVERED]: [], // Terminal state
  [TribMessageStatus.FAILED]: [TribMessageStatus.QUEUED], // Can retry
  [TribMessageStatus.UNDELIVERED]: [TribMessageStatus.QUEUED], // Can retry
  [TribMessageStatus.CANCELED]: [], // Terminal state
};

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: TribMessageStatus,
  newStatus: TribMessageStatus,
): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Terminal status check
 * Returns true if the status represents a final state
 */
export function isTerminalStatus(status: TribMessageStatus): boolean {
  const terminalStatuses = [
    TribMessageStatus.DELIVERED,
    TribMessageStatus.CANCELED,
  ];
  return terminalStatuses.includes(status);
}

/**
 * Failed status check
 * Returns true if the status represents a failure that can be retried
 */
export function isRetryableFailure(status: TribMessageStatus): boolean {
  const retryableStatuses = [
    TribMessageStatus.FAILED,
    TribMessageStatus.UNDELIVERED,
  ];
  return retryableStatuses.includes(status);
}

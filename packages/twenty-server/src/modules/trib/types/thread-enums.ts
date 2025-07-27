/**
 * Thread status enum for conversation lifecycle management
 * Tracks the current state of a conversation thread
 */
export enum TribThreadStatus {
  /** Thread is active and can receive messages */
  ACTIVE = 'active',
  /** Thread has been archived by user */
  ARCHIVED = 'archived',
  /** Thread has been blocked (no further messages allowed) */
  BLOCKED = 'blocked',
  /** Thread is closed and completed */
  CLOSED = 'closed',
  /** Thread is paused (temporarily inactive) */
  PAUSED = 'paused',
}

/**
 * Thread type enum for different conversation types
 */
export enum TribThreadType {
  /** Individual one-on-one conversation */
  INDIVIDUAL = 'individual',
  /** Group conversation with multiple participants */
  GROUP = 'group',
  /** Broadcast thread for announcements */
  BROADCAST = 'broadcast',
  /** Support/help desk thread */
  SUPPORT = 'support',
  /** Marketing/promotional thread */
  MARKETING = 'marketing',
}

/**
 * Thread priority levels
 */
export enum TribThreadPriority {
  /** Low priority thread */
  LOW = 'low',
  /** Normal priority thread */
  NORMAL = 'normal',
  /** High priority thread */
  HIGH = 'high',
  /** Critical priority thread */
  CRITICAL = 'critical',
}

/**
 * Type guards for enum validation
 */
export function isValidTribThreadStatus(
  value: string,
): value is TribThreadStatus {
  return Object.values(TribThreadStatus).includes(value as TribThreadStatus);
}

export function isValidTribThreadType(value: string): value is TribThreadType {
  return Object.values(TribThreadType).includes(value as TribThreadType);
}

export function isValidTribThreadPriority(
  value: string,
): value is TribThreadPriority {
  return Object.values(TribThreadPriority).includes(
    value as TribThreadPriority,
  );
}

/**
 * Status transition validation
 * Defines valid state transitions for thread status
 */
export const VALID_THREAD_STATUS_TRANSITIONS: Record<
  TribThreadStatus,
  TribThreadStatus[]
> = {
  [TribThreadStatus.ACTIVE]: [
    TribThreadStatus.ARCHIVED,
    TribThreadStatus.BLOCKED,
    TribThreadStatus.CLOSED,
    TribThreadStatus.PAUSED,
  ],
  [TribThreadStatus.ARCHIVED]: [TribThreadStatus.ACTIVE], // Can reopen archived threads
  [TribThreadStatus.BLOCKED]: [TribThreadStatus.ACTIVE], // Can unblock threads
  [TribThreadStatus.CLOSED]: [TribThreadStatus.ACTIVE], // Can reopen closed threads
  [TribThreadStatus.PAUSED]: [TribThreadStatus.ACTIVE, TribThreadStatus.CLOSED], // Can resume or close paused threads
};

/**
 * Validates if a thread status transition is allowed
 */
export function isValidThreadStatusTransition(
  currentStatus: TribThreadStatus,
  newStatus: TribThreadStatus,
): boolean {
  const allowedTransitions = VALID_THREAD_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Checks if thread status allows receiving new messages
 */
export function canReceiveMessages(status: TribThreadStatus): boolean {
  return status === TribThreadStatus.ACTIVE;
}

/**
 * Checks if thread status allows sending messages
 */
export function canSendMessages(status: TribThreadStatus): boolean {
  return [TribThreadStatus.ACTIVE, TribThreadStatus.PAUSED].includes(status);
}

/**
 * Checks if thread is in a terminal state
 */
export function isTerminalThreadStatus(status: TribThreadStatus): boolean {
  return status === TribThreadStatus.CLOSED;
}

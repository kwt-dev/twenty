/**
 * TribMessage Repository Interface
 *
 * Defines the contract for message data access operations.
 * This interface enables complete DI token isolation as described in
 * the circular dependency fix documentation.
 */

import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
} from '../types/message-enums';

export interface TribMessage {
  id: string;
  content: string;
  status: TribMessageStatus;
  channel: TribMessageChannel;
  direction: TribMessageDirection;
  from: string;
  to: string;
  timestamp?: Date | null;
  externalId?: string | null;
  contactId?: string | null;
  threadId?: string | null;
  metadata?: Record<string, any> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ITribMessageRepository {
  /**
   * Create a new message
   */
  create(data: Partial<TribMessage>): Promise<TribMessage>;

  /**
   * Find a message by ID
   */
  findById(id: string): Promise<TribMessage | null>;

  /**
   * Find a message by external ID (for webhook processing)
   */
  findByExternalId(externalId: string): Promise<TribMessage | null>;

  /**
   * Update a message
   */
  update(id: string, data: Partial<TribMessage>): Promise<TribMessage>;

  /**
   * Find messages by thread ID
   */
  findByThreadId(threadId: string): Promise<TribMessage[]>;

  /**
   * Find messages by contact ID
   */
  findByContactId(contactId: string): Promise<TribMessage[]>;

  /**
   * Find messages by status
   */
  findByStatus(status: TribMessageStatus): Promise<TribMessage[]>;

  /**
   * Create repository instance for specific workspace (for queue processor use)
   */
  withWorkspaceId(workspaceId: string): Promise<ITribMessageRepository>;
}

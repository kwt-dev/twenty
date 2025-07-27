/**
 * Default Message Repository Implementation
 *
 * Provides in-memory implementation for standalone operation and testing.
 * This enables the module to work without Twenty's workspace ORM system,
 * following the complete DI token isolation pattern.
 */

import { Injectable } from '@nestjs/common';
import {
  ITribMessageRepository,
  TribMessage,
} from '../interfaces/trib-message.repository.interface';
import { TribMessageStatus } from '../types/message-enums';

@Injectable()
export class DefaultMessageRepository implements ITribMessageRepository {
  private messages: Map<string, TribMessage> = new Map();
  private counter = 1;

  async create(data: Partial<TribMessage>): Promise<TribMessage> {
    const id = data.id || this.generateId();
    const now = new Date();

    const message: TribMessage = {
      id,
      content: data.content || '',
      status: data.status || TribMessageStatus.QUEUED,
      channel: data.channel!,
      direction: data.direction!,
      from: data.from || '',
      to: data.to || '',
      timestamp: data.timestamp || now,
      externalId: data.externalId || null,
      contactId: data.contactId || null,
      threadId: data.threadId || null,
      metadata: data.metadata || null,
      errorCode: data.errorCode || null,
      errorMessage: data.errorMessage || null,
      retryCount: data.retryCount || 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.messages.set(id, message);
    return message;
  }

  async findById(id: string): Promise<TribMessage | null> {
    return this.messages.get(id) || null;
  }

  async findByExternalId(externalId: string): Promise<TribMessage | null> {
    for (const message of this.messages.values()) {
      if (message.externalId === externalId) {
        return message;
      }
    }
    return null;
  }

  async update(id: string, data: Partial<TribMessage>): Promise<TribMessage> {
    const existing = this.messages.get(id);
    if (!existing) {
      throw new Error(`Message with id ${id} not found`);
    }

    const updated: TribMessage = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID changes
      updatedAt: new Date(),
    };

    this.messages.set(id, updated);
    return updated;
  }

  async findByThreadId(threadId: string): Promise<TribMessage[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.threadId === threadId,
    );
  }

  async findByContactId(contactId: string): Promise<TribMessage[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.contactId === contactId,
    );
  }

  async findByStatus(status: TribMessageStatus): Promise<TribMessage[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.status === status,
    );
  }

  async withWorkspaceId(workspaceId: string): Promise<ITribMessageRepository> {
    // For default in-memory implementation, return this instance
    // In real workspace implementation, this would create a workspace-specific repository
    return this;
  }

  private generateId(): string {
    return `msg_${this.counter++}_${Date.now()}`;
  }

  // Helper methods for testing
  clear(): void {
    this.messages.clear();
    this.counter = 1;
  }

  size(): number {
    return this.messages.size;
  }
}

import { Injectable } from '@nestjs/common';
import {
  TribDelivery,
  ITribDeliveryRepository,
} from '../interfaces/trib-delivery.repository.interface';
import { TribDeliveryStatus } from '../types/delivery-enums';

/**
 * Default implementation of ITribDeliveryRepository
 *
 * This is a minimal implementation that provides basic CRUD operations
 * for delivery tracking. In a production environment, this would be
 * replaced with actual database operations.
 */
@Injectable()
export class DefaultTribDeliveryRepository implements ITribDeliveryRepository {
  private deliveries: Map<string, TribDelivery> = new Map();
  private nextId = 1;

  async create(data: Partial<TribDelivery>): Promise<TribDelivery> {
    const id = data.id || `delivery_${this.nextId++}`;
    const now = new Date();

    const delivery: TribDelivery = {
      id,
      messageId: data.messageId || '',
      externalId: data.externalId || '',
      status: data.status || TribDeliveryStatus.PENDING,
      providerResponse: data.providerResponse || null,
      deliveredAt: data.deliveredAt || null,
      failedAt: data.failedAt || null,
      errorCode: data.errorCode || null,
      errorMessage: data.errorMessage || null,
      retryCount: data.retryCount || 0,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      deletedAt: data.deletedAt || null,
    };

    this.deliveries.set(id, delivery);
    return delivery;
  }

  async findById(id: string): Promise<TribDelivery | null> {
    return this.deliveries.get(id) || null;
  }

  async findByExternalId(externalId: string): Promise<TribDelivery | null> {
    for (const delivery of this.deliveries.values()) {
      if (delivery.externalId === externalId && !delivery.deletedAt) {
        return delivery;
      }
    }
    return null;
  }

  async findByMessageId(messageId: string): Promise<TribDelivery | null> {
    for (const delivery of this.deliveries.values()) {
      if (delivery.messageId === messageId && !delivery.deletedAt) {
        return delivery;
      }
    }
    return null;
  }

  async update(id: string, data: Partial<TribDelivery>): Promise<TribDelivery> {
    const existing = this.deliveries.get(id);
    if (!existing) {
      throw new Error(`Delivery with id ${id} not found`);
    }

    const updated: TribDelivery = {
      ...existing,
      ...data,
      id, // Ensure ID cannot be changed
      updatedAt: new Date(),
    };

    this.deliveries.set(id, updated);
    return updated;
  }

  async findByStatus(status: TribDeliveryStatus): Promise<TribDelivery[]> {
    const results: TribDelivery[] = [];
    for (const delivery of this.deliveries.values()) {
      if (delivery.status === status && !delivery.deletedAt) {
        results.push(delivery);
      }
    }
    return results;
  }
}

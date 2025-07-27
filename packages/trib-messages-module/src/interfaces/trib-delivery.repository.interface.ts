import { TribDeliveryStatus } from '../types/delivery-enums';

export interface TribDelivery {
  id: string;
  messageId: string;
  externalId: string;
  status: TribDeliveryStatus;
  providerResponse?: Record<string, any> | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ITribDeliveryRepository {
  create(data: Partial<TribDelivery>): Promise<TribDelivery>;
  findById(id: string): Promise<TribDelivery | null>;
  findByExternalId(externalId: string): Promise<TribDelivery | null>;
  findByMessageId(messageId: string): Promise<TribDelivery | null>;
  update(id: string, data: Partial<TribDelivery>): Promise<TribDelivery>;
  findByStatus(status: TribDeliveryStatus): Promise<TribDelivery[]>;
}

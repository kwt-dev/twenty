import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { TRIB_TOKENS } from '../tokens';

/**
 * Interface matching Twenty's MessageQueueService
 * Used for dependency injection abstraction
 */
export interface IMessageQueueService {
  add<T>(jobName: string, data: T, options?: any): Promise<void>;
  addCron?(params: any): Promise<void>;
  removeCron?(params: any): Promise<void>;
  work?<T>(handler: any, options?: any): any;
}

/**
 * Default Message Queue Service implementation using Bull
 *
 * This provides a Twenty-compatible interface while using standard Bull queues.
 * When integrated with Twenty, this can be overridden via forRoot() to use
 * Twenty's MessageQueueService directly.
 */
@Injectable()
export class DefaultMessageQueueService implements IMessageQueueService {
  constructor(
    @Inject(getQueueToken(TRIB_TOKENS.QUEUE_NAME))
    private readonly queue: Queue,
  ) {}

  async add<T>(jobName: string, data: T, options?: any): Promise<void> {
    await this.queue.add(jobName, data, options);
  }

  async addCron(params: any): Promise<void> {
    // Basic cron implementation - could be enhanced
    throw new Error('Cron jobs not implemented in default queue service');
  }

  async removeCron(params: any): Promise<void> {
    throw new Error('Cron jobs not implemented in default queue service');
  }

  work<T>(handler: any, options?: any): any {
    // Work method not typically used with Bull decorators
    return this.queue.process(handler);
  }
}

/**
 * Factory function for creating the default message queue service
 */
export function createDefaultMessageQueueService(
  queue: Queue,
): DefaultMessageQueueService {
  return new DefaultMessageQueueService(queue);
}

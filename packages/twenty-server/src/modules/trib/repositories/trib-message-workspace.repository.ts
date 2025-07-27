import { Injectable, Scope } from '@nestjs/common';
import { ITribMessageRepository, TribMessage, TribMessageStatus } from '@twenty/trib-messages-module';
import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { TribMessageWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message.workspace-entity';

/**
 * TribMessageWorkspaceRepository
 * 
 * Workspace-aware implementation of ITribMessageRepository that integrates
 * TRIB SMS functionality with Twenty's multi-tenant workspace system.
 * 
 * CRITICAL DESIGN CONSTRAINTS:
 * - Must implement exact ITribMessageRepository interface (7 methods)
 * - Must use ScopedWorkspaceContextFactory for workspace context (NO workspaceId parameters)
 * - Must be REQUEST-scoped to access workspace context properly
 * - Bridge logic for Person-SMS linking goes in separate TribWorkspaceService
 */
@Injectable({ scope: Scope.REQUEST })
export class TribMessageWorkspaceRepository implements ITribMessageRepository {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {}

  private async getWorkspaceId(): Promise<string> {
    const { workspaceId } = this.scopedWorkspaceContextFactory.create();
    if (!workspaceId) {
      throw new Error('Workspace context is required for TRIB repository operations');
    }
    return workspaceId;
  }

  private async getRepository() {
    const workspaceId = await this.getWorkspaceId();
    return this.twentyORMGlobalManager.getRepositoryForWorkspace(
      workspaceId,
      TribMessageWorkspaceEntity,
    );
  }

  /**
   * Convert TribMessageWorkspaceEntity to TribMessage interface
   * Handles type compatibility between Twenty entities (string dates) and TRIB interface (Date objects)
   */
  private convertToTribMessage(entity: TribMessageWorkspaceEntity): TribMessage {
    return {
      id: entity.id,
      content: entity.content,
      status: entity.status,
      channel: entity.channel,
      direction: entity.direction,
      from: entity.from,
      to: entity.to,
      timestamp: entity.timestamp,
      externalId: entity.externalId,
      contactId: entity.contactPersonId,
      threadId: entity.threadId,
      metadata: entity.metadata,
      errorCode: entity.errorCode,
      errorMessage: entity.errorMessage,
      retryCount: entity.retryCount,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      deletedAt: entity.deletedAt ? new Date(entity.deletedAt) : undefined,
    };
  }

  /**
   * Convert TribMessage data to TribMessageWorkspaceEntity format
   * Handles type conversion for data going into Twenty's workspace system
   */
  private convertFromTribMessage(data: Partial<TribMessage>): any {
    const converted: any = {
      ...data,
      contactPersonId: data.contactId, // Map contactId to contactPersonId
    };

    // Remove contactId since we mapped it to contactPersonId
    delete converted.contactId;

    return converted;
  }

  /**
   * Create a new message
   */
  async create(data: Partial<TribMessage>): Promise<TribMessage> {
    const repository = await this.getRepository();
    const entityData = this.convertFromTribMessage(data);
    const savedEntity = await repository.save(entityData);
    return this.convertToTribMessage(savedEntity);
  }

  /**
   * Find a message by ID
   */
  async findById(id: string): Promise<TribMessage | null> {
    const repository = await this.getRepository();
    const entity = await repository.findOne({ where: { id } });
    return entity ? this.convertToTribMessage(entity) : null;
  }

  /**
   * Find a message by external ID (for webhook processing)
   */
  async findByExternalId(externalId: string): Promise<TribMessage | null> {
    const repository = await this.getRepository();
    const entity = await repository.findOne({ where: { externalId } });
    return entity ? this.convertToTribMessage(entity) : null;
  }

  /**
   * Update a message
   */
  async update(id: string, data: Partial<TribMessage>): Promise<TribMessage> {
    const repository = await this.getRepository();
    const entityData = this.convertFromTribMessage(data);
    await repository.update({ id }, entityData);
    
    const updated = await repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Message with id ${id} not found after update`);
    }
    return this.convertToTribMessage(updated);
  }

  /**
   * Find messages by thread ID
   */
  async findByThreadId(threadId: string): Promise<TribMessage[]> {
    const repository = await this.getRepository();
    const entities = await repository.find({ 
      where: { threadId },
      order: { createdAt: 'ASC' }
    });
    return entities.map(entity => this.convertToTribMessage(entity));
  }

  /**
   * Find messages by contact ID
   */
  async findByContactId(contactId: string): Promise<TribMessage[]> {
    const repository = await this.getRepository();
    const entities = await repository.find({ 
      where: { contactPersonId: contactId },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.convertToTribMessage(entity));
  }

  /**
   * Find messages by status
   */
  async findByStatus(status: TribMessageStatus): Promise<TribMessage[]> {
    const repository = await this.getRepository();
    const entities = await repository.find({ 
      where: { status },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.convertToTribMessage(entity));
  }

  /**
   * Create repository instance for specific workspace (for queue processor use)
   * @param workspaceId - Explicit workspace ID for multi-tenant operations
   * @returns Repository instance configured for the specified workspace
   */
  async withWorkspaceId(workspaceId: string): Promise<ITribMessageRepository> {
    const repository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
      workspaceId, 
      TribMessageWorkspaceEntity
    );
    
    // Return adapter that implements ITribMessageRepository interface
    const self = this;
    return {
      findById: async (id: string): Promise<TribMessage | null> => {
        const entity = await repository.findOne({ where: { id } });
        return entity ? self.convertToTribMessage(entity) : null;
      },
      
      update: async (id: string, data: Partial<TribMessage>): Promise<TribMessage> => {
        const entityData = self.convertFromTribMessage(data);
        await repository.update({ id }, entityData);
        
        const updated = await repository.findOne({ where: { id } });
        if (!updated) {
          throw new Error(`Message with id ${id} not found after update`);
        }
        return self.convertToTribMessage(updated);
      },
      
      // Add other methods as needed by SmsStatusUpdaterService
      create: async (data: Partial<TribMessage>): Promise<TribMessage> => {
        const entityData = self.convertFromTribMessage(data);
        const savedEntity = await repository.save(entityData);
        return self.convertToTribMessage(savedEntity);
      },
      
      findByExternalId: async (externalId: string): Promise<TribMessage | null> => {
        const entity = await repository.findOne({ where: { externalId } });
        return entity ? self.convertToTribMessage(entity) : null;
      },
      
      findByThreadId: async (threadId: string): Promise<TribMessage[]> => {
        const entities = await repository.find({ 
          where: { threadId },
          order: { createdAt: 'ASC' }
        });
        return entities.map((entity: TribMessageWorkspaceEntity) => self.convertToTribMessage(entity));
      },
      
      findByContactId: async (contactId: string): Promise<TribMessage[]> => {
        const entities = await repository.find({ 
          where: { contactPersonId: contactId },
          order: { createdAt: 'DESC' }
        });
        return entities.map((entity: TribMessageWorkspaceEntity) => self.convertToTribMessage(entity));
      },
      
      findByStatus: async (status: TribMessageStatus): Promise<TribMessage[]> => {
        const entities = await repository.find({ 
          where: { status },
          order: { createdAt: 'DESC' }
        });
        return entities.map((entity: TribMessageWorkspaceEntity) => self.convertToTribMessage(entity));
      },

      withWorkspaceId: async (workspaceId: string): Promise<ITribMessageRepository> => {
        return self.withWorkspaceId(workspaceId);
      }
    };
  }
}
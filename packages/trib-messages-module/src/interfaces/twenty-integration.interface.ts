/**
 * Twenty Integration Interfaces
 * 
 * These interfaces define the contracts for Twenty server components
 * that are injected into the TRIB module via dependency injection tokens.
 */

/**
 * Database event actions that can be emitted
 */
export enum DatabaseEventAction {
  CREATED = 'created',
  UPDATED = 'updated', 
  DELETED = 'deleted',
  DESTROYED = 'destroyed',
  RESTORED = 'restored',
}

/**
 * Interface for Twenty's WorkspaceEventEmitter
 * 
 * This interface defines the contract for emitting database events
 * that trigger real-time updates in the Twenty frontend.
 */
export interface IWorkspaceEventEmitter {
  /**
   * Emit database batch events for real-time frontend updates
   * 
   * @param params - Event emission parameters
   */
  emitDatabaseBatchEvent<T>(params: {
    objectMetadataNameSingular: string;
    action: DatabaseEventAction;
    events: Array<{
      recordId: string;
      objectMetadata: any;
      properties: {
        after: T;
      };
    }>;
    workspaceId: string;
  }): void;
}
import { TRIB_MESSAGE_OBJECT_IDS } from './trib-standard-object-ids';

/**
 * Static ObjectMetadata stub for TribMessage entity
 * 
 * WARNING: This is a temporary solution to avoid cross-package dependency injection issues.
 * Source of truth: twenty-server/src/engine/metadata-modules/object-metadata/
 * 
 * MAINTENANCE: Update this stub whenever TribMessage metadata changes in canonical source.
 * TODO: Replace with shared @twenty/object-metadata-sdk package (Ticket: TM-XXX)
 */
export const TRIB_MESSAGE_OBJECT_METADATA_STUB = {
  id: TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE,
  standardId: TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE,
  workspaceId: '', // Set dynamically per call
  nameSingular: 'tribMessage',
  namePlural: 'tribMessages',
  labelSingular: 'TRIB Message',
  labelPlural: 'TRIB Messages',
  description: 'A message in the TRIB messaging system',
  icon: 'IconMessage',
  targetTableName: 'tribMessage',
  fields: [], // Not used by webhook/timeline/audit systems
  indexMetadatas: [], // Excluded per ObjectRecordBaseEvent type
  isSystem: false, // TRIB entities are custom, not system
  isCustom: true,
  isActive: true,
  isRemote: false,
  isAuditLogged: true,
  isSearchable: true,
  duplicateCriteria: [],
  labelIdentifierFieldMetadataId: null,
  imageIdentifierFieldMetadataId: null,
} as const;

/**
 * Helper function to get workspace-specific metadata
 */
export function getTribMessageMetadata(workspaceId: string) {
  return {
    ...TRIB_MESSAGE_OBJECT_METADATA_STUB,
    workspaceId,
  };
}
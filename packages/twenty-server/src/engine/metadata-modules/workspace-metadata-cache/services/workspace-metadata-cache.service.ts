import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import { Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { IndexMetadataEntity } from 'src/engine/metadata-modules/index-metadata/index-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataMaps } from 'src/engine/metadata-modules/types/object-metadata-maps';
import { generateObjectMetadataMaps } from 'src/engine/metadata-modules/utils/generate-object-metadata-maps.util';
import {
  WorkspaceMetadataVersionException,
  WorkspaceMetadataVersionExceptionCode,
} from 'src/engine/metadata-modules/workspace-metadata-version/exceptions/workspace-metadata-version.exception';
import { WorkspaceCacheStorageService } from 'src/engine/workspace-cache-storage/workspace-cache-storage.service';

type getExistingOrRecomputeMetadataMapsResult = {
  objectMetadataMaps: ObjectMetadataMaps;
  metadataVersion: number;
};

@Injectable()
export class WorkspaceMetadataCacheService {
  logger = new Logger(WorkspaceMetadataCacheService.name);

  constructor(
    @InjectRepository(Workspace, 'core')
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly workspaceCacheStorageService: WorkspaceCacheStorageService,
    @InjectRepository(ObjectMetadataEntity, 'core')
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(IndexMetadataEntity, 'core')
    private readonly indexMetadataRepository: Repository<IndexMetadataEntity>,
  ) {}

  async getExistingOrRecomputeMetadataMaps({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<getExistingOrRecomputeMetadataMapsResult> {
    const currentCacheVersion =
      await this.getMetadataVersionFromCache(workspaceId);

    const currentDatabaseVersion =
      await this.getMetadataVersionFromDatabase(workspaceId);

    if (!isDefined(currentDatabaseVersion)) {
      throw new WorkspaceMetadataVersionException(
        'Metadata version not found in the database',
        WorkspaceMetadataVersionExceptionCode.METADATA_VERSION_NOT_FOUND,
      );
    }

    const shouldRecompute =
      !isDefined(currentCacheVersion) ||
      currentCacheVersion !== currentDatabaseVersion;

    const existingObjectMetadataMaps =
      await this.workspaceCacheStorageService.getObjectMetadataMaps(
        workspaceId,
        currentDatabaseVersion,
      );

    if (isDefined(existingObjectMetadataMaps) && !shouldRecompute) {
      return {
        objectMetadataMaps: existingObjectMetadataMaps,
        metadataVersion: currentDatabaseVersion,
      };
    }

    const { objectMetadataMaps, metadataVersion } =
      await this.recomputeMetadataCache({
        workspaceId,
      });

    return {
      objectMetadataMaps,
      metadataVersion,
    };
  }

  async recomputeMetadataCache({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<getExistingOrRecomputeMetadataMapsResult> {
    const currentDatabaseVersion =
      await this.getMetadataVersionFromDatabase(workspaceId);

    if (!isDefined(currentDatabaseVersion)) {
      throw new WorkspaceMetadataVersionException(
        'Metadata version not found in the database',
        WorkspaceMetadataVersionExceptionCode.METADATA_VERSION_NOT_FOUND,
      );
    }

    await this.workspaceCacheStorageService.flushVersionedMetadata(workspaceId);

    const objectMetadataItems = await this.objectMetadataRepository.find({
      where: { workspaceId },
      relations: ['fields'],
    });

    const objectMetadataItemsIds = objectMetadataItems.map(
      (objectMetadataItem) => objectMetadataItem.id,
    );

    const indexMetadataItems = await this.indexMetadataRepository.find({
      where: { objectMetadataId: In(objectMetadataItemsIds) },
      relations: ['indexFieldMetadatas'],
    });

    const objectMetadataItemsWithIndexMetadatas = objectMetadataItems.map(
      (objectMetadataItem) => ({
        ...objectMetadataItem,
        indexMetadatas: indexMetadataItems.filter(
          (indexMetadataItem) =>
            indexMetadataItem.objectMetadataId === objectMetadataItem.id,
        ),
      }),
    );

    const freshObjectMetadataMaps = generateObjectMetadataMaps(
      objectMetadataItemsWithIndexMetadatas,
    );

    // === TRIB MESSAGE METADATA DIAGNOSTIC - Phase 7A ===
    this.logger.log('=== TRIB MESSAGE METADATA DIAGNOSTIC START ===');
    
    // Check if TribMessage exists in metadata maps
    const tribMessageId = freshObjectMetadataMaps.idByNameSingular['tribMessage'];
    if (tribMessageId) {
      const tribMessageMetadata = freshObjectMetadataMaps.byId[tribMessageId];
      this.logger.log(`✅ TribMessage found with ID: ${tribMessageId}`);
      this.logger.log(`TribMessage nameSingular: ${tribMessageMetadata.nameSingular}`);
      this.logger.log(`TribMessage fields count: ${Object.keys(tribMessageMetadata.fieldsById || {}).length}`);
      
      // Log all field names and IDs
      if (tribMessageMetadata.fieldsById) {
        this.logger.log('TribMessage fieldsById:');
        Object.entries(tribMessageMetadata.fieldsById).forEach(([fieldId, field]) => {
          this.logger.log(`  - ${field.name} (ID: ${fieldId}, type: ${field.type})`);
        });
        
        this.logger.log('TribMessage fieldIdByName:');
        Object.entries(tribMessageMetadata.fieldIdByName || {}).forEach(([fieldName, fieldId]) => {
          this.logger.log(`  - ${fieldName} -> ${fieldId}`);
        });
      } else {
        this.logger.error('❌ TribMessage fieldsById is missing or empty!');
      }
    } else {
      this.logger.error('❌ TribMessage NOT found in metadata maps!');
      this.logger.log('Available entities:', Object.keys(freshObjectMetadataMaps.idByNameSingular));
    }
    
    // Compare with a working entity (Person) for reference
    const personId = freshObjectMetadataMaps.idByNameSingular['person'];
    if (personId) {
      const personMetadata = freshObjectMetadataMaps.byId[personId];
      this.logger.log(`✅ Person found with ${Object.keys(personMetadata.fieldsById || {}).length} fields (for comparison)`);
    }
    
    this.logger.log('=== TRIB MESSAGE METADATA DIAGNOSTIC END ===');
    // === END DIAGNOSTIC ===

    await this.workspaceCacheStorageService.setObjectMetadataMaps(
      workspaceId,
      currentDatabaseVersion,
      freshObjectMetadataMaps,
    );

    await this.workspaceCacheStorageService.setMetadataVersion(
      workspaceId,
      currentDatabaseVersion,
    );

    return {
      objectMetadataMaps: freshObjectMetadataMaps,
      metadataVersion: currentDatabaseVersion,
    };
  }

  private async getMetadataVersionFromDatabase(
    workspaceId: string,
  ): Promise<number | undefined> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    return workspace?.metadataVersion;
  }

  private async getMetadataVersionFromCache(
    workspaceId: string,
  ): Promise<number | undefined> {
    return await this.workspaceCacheStorageService.getMetadataVersion(
      workspaceId,
    );
  }
}

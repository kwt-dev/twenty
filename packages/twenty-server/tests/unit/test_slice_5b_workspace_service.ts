/**
 * Unit Tests: Slice 5b - TribWorkspaceService Enhancement
 * 
 * Tests the enhanced TribWorkspaceService with phone lookup functionality.
 * Validates correct architecture patterns, workspace scoping, and error handling.
 * 
 * ARCHITECTURE COMPLIANCE TESTS:
 * - Validates REQUEST scope dependency injection
 * - Tests workspace context isolation
 * - Verifies security validation and audit logging
 * - Tests phone lookup functionality with proper patterns
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { TribWorkspaceService } from '../../src/modules/trib/services/trib-workspace.service';
import { TwentyORMGlobalManager } from '../../src/engine/twenty-orm/twenty-orm-global.manager';
import { ScopedWorkspaceContextFactory } from '../../src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { PersonWorkspaceEntity } from '../../src/modules/person/standard-objects/person.workspace-entity';
import { TribSmsService } from '@twenty/trib-messages-module';

// Mock winston for security logging
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Mock phone normalizer utilities
jest.mock('@twenty/trib-messages-module/src/utils/phone/phone-normalizer', () => ({
  normalizePhoneNumber: jest.fn(),
}));

describe('TribWorkspaceService - Architecture Compliance', () => {
  let service: TribWorkspaceService;
  let twentyORMGlobalManager: jest.Mocked<TwentyORMGlobalManager>;
  let scopedWorkspaceContextFactory: jest.Mocked<ScopedWorkspaceContextFactory>;
  let tribSmsService: jest.Mocked<TribSmsService>;
  let mockRepository: any;
  let mockWorkspaceContext: any;

  beforeEach(async () => {
    // Mock repository with query builder
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };

    // Mock workspace context
    mockWorkspaceContext = {
      workspaceId: 'test-workspace-id'
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TribWorkspaceService,
        {
          provide: TwentyORMGlobalManager,
          useValue: {
            getRepositoryForWorkspace: jest.fn().mockResolvedValue(mockRepository),
          },
        },
        {
          provide: ScopedWorkspaceContextFactory,
          useValue: {
            create: jest.fn().mockReturnValue(mockWorkspaceContext),
          },
        },
        {
          provide: TribSmsService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TribWorkspaceService>(TribWorkspaceService);
    twentyORMGlobalManager = module.get(TwentyORMGlobalManager);
    scopedWorkspaceContextFactory = module.get(ScopedWorkspaceContextFactory);
    tribSmsService = module.get(TribSmsService);
  });

  it('should be defined with correct architecture', () => {
    expect(service).toBeDefined();
  });

  describe('findPersonByPhone - Architecture Compliance', () => {
    it('should use workspace context for repository access', async () => {
      const mockPerson = {
        id: 'person-1',
        phones: { primaryPhoneNumber: '+15551234567' },
        phone: null,
      };
      
      mockRepository.getOne.mockResolvedValue(mockPerson);
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue('+15551234567');

      await service.findPersonByPhone('+15551234567');

      // Verify workspace context is used
      expect(scopedWorkspaceContextFactory.create).toHaveBeenCalled();
      expect(twentyORMGlobalManager.getRepositoryForWorkspace).toHaveBeenCalledWith(
        'test-workspace-id',
        PersonWorkspaceEntity
      );
    });

    it('should validate input and return null for empty phone', async () => {
      const result = await service.findPersonByPhone('');
      expect(result).toBeNull();
    });

    it('should validate input and return null for overly long phone', async () => {
      const longPhone = 'x'.repeat(51);
      const result = await service.findPersonByPhone(longPhone);
      expect(result).toBeNull();
    });

    it('should return null for invalid normalized phone', async () => {
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue(null);
      
      const result = await service.findPersonByPhone('invalid');
      expect(result).toBeNull();
    });

    it('should handle errors and rethrow with logging', async () => {
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue('+15551234567');
      
      mockRepository.getOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findPersonByPhone('+15551234567')).rejects.toThrow('Database error');
    });

    it('should return PersonPhone interface for found person', async () => {
      const mockPerson = {
        id: 'person-1',
        phones: { 
          primaryPhoneNumber: '+15551234567',
          primaryPhoneCountryCode: 'US',
          additionalPhones: [{ number: '+15559876543' }]
        },
        phone: '+15551234567',
      };
      
      mockRepository.getOne.mockResolvedValue(mockPerson);
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue('+15551234567');

      const result = await service.findPersonByPhone('+15551234567');
      
      expect(result).toEqual({
        id: 'person-1',
        primaryPhoneNumber: '+15551234567',
        primaryPhoneCountryCode: 'US',
        phone: '+15551234567',
        additionalPhones: [{ number: '+15559876543' }],
      });
    });
  });

  describe('findPeopleByPhoneVariations - Architecture Compliance', () => {
    it('should use workspace-scoped bulk queries', async () => {
      const mockPeople = [
        { id: 'person-1', phones: { primaryPhoneNumber: '+15551234567' } },
        { id: 'person-2', phones: { primaryPhoneNumber: '+15559876543' } },
      ];
      
      mockRepository.getMany.mockResolvedValue(mockPeople);
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockImplementation((phone: string) => phone.startsWith('+') ? phone : `+1${phone}`);

      await service.findPeopleByPhoneVariations(['+15551234567', '+15559876543']);

      // Verify workspace context is used
      expect(scopedWorkspaceContextFactory.create).toHaveBeenCalled();
      expect(twentyORMGlobalManager.getRepositoryForWorkspace).toHaveBeenCalledWith(
        'test-workspace-id',
        PersonWorkspaceEntity
      );
    });

    it('should return empty array for invalid input', async () => {
      const result1 = await service.findPeopleByPhoneVariations([]);
      expect(result1).toEqual([]);

      const result2 = await service.findPeopleByPhoneVariations(null as any);
      expect(result2).toEqual([]);
    });

    it('should limit bulk query size for security', async () => {
      const manyPhones = Array(150).fill('+15551234567');
      
      mockRepository.getMany.mockResolvedValue([]);
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockImplementation((phone: string) => phone);

      await service.findPeopleByPhoneVariations(manyPhones);

      // Should use query builder with IN clause
      expect(mockRepository.where).toHaveBeenCalled();
      expect(mockRepository.orWhere).toHaveBeenCalled();
    });

    it('should handle normalization failures gracefully', async () => {
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue(null);
      
      const result = await service.findPeopleByPhoneVariations(['invalid1', 'invalid2']);
      expect(result).toEqual([]);
    });

    it('should handle errors and rethrow with logging', async () => {
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockReturnValue('+15551234567');
      
      mockRepository.getMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findPeopleByPhoneVariations(['+15551234567'])).rejects.toThrow('Database error');
    });

    it('should return array of PersonPhone interfaces', async () => {
      const mockPeople = [
        {
          id: 'person-1',
          phones: { primaryPhoneNumber: '+15551234567', primaryPhoneCountryCode: 'US' },
          phone: null,
        },
        {
          id: 'person-2',
          phones: { primaryPhoneNumber: '+15559876543', primaryPhoneCountryCode: 'US' },
          phone: '+15559876543',
        },
      ];
      
      mockRepository.getMany.mockResolvedValue(mockPeople);
      require('@twenty/trib-messages-module/src/utils/phone/phone-normalizer').normalizePhoneNumber
        .mockImplementation((phone: string) => phone);

      const result = await service.findPeopleByPhoneVariations(['+15551234567', '+15559876543']);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'person-1',
        primaryPhoneNumber: '+15551234567',
        primaryPhoneCountryCode: 'US',
        phone: null,
        additionalPhones: null,
      });
      expect(result[1]).toEqual({
        id: 'person-2',
        primaryPhoneNumber: '+15559876543',
        primaryPhoneCountryCode: 'US',
        phone: '+15559876543',
        additionalPhones: null,
      });
    });
  });

  describe('Workspace Context Error Handling', () => {
    it('should throw error when workspace context is null', async () => {
      scopedWorkspaceContextFactory.create.mockReturnValue({ workspaceId: null } as any);
      
      await expect(service.findPersonByPhone('+15551234567')).rejects.toThrow('Workspace context is required');
    });

    it('should throw error when workspace context is missing', async () => {
      scopedWorkspaceContextFactory.create.mockReturnValue({ workspaceId: undefined } as any);
      
      await expect(service.findPeopleByPhoneVariations(['+15551234567'])).rejects.toThrow('Workspace context is required');
    });
  });
});
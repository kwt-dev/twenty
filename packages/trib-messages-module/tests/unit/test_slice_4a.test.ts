import {
  ITribMessageParticipantRepository,
  TribMessageParticipant,
  CreateTribMessageParticipantData,
} from '../../src/interfaces/trib-message-participant.repository.interface';
import { TRIB_TOKENS } from '../../src/tokens';

describe('Slice 4a: Message Participant Interface - Twenty CRM TRIB SMS Integration', () => {
  describe('ITribMessageParticipantRepository Interface', () => {
    it('should define all required method signatures for TRIB SMS workflow', () => {
      // This test ensures interface compilation and structure for Twenty CRM integration
      const mockRepository: ITribMessageParticipantRepository = {
        create: jest.fn(),
        findByMessageId: jest.fn(),
        findByPersonId: jest.fn(),
        findByMessageAndPerson: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createBulk: jest.fn(),
      };

      expect(typeof mockRepository.create).toBe('function');
      expect(typeof mockRepository.findByMessageId).toBe('function');
      expect(typeof mockRepository.findByPersonId).toBe('function');
      expect(typeof mockRepository.findByMessageAndPerson).toBe('function');
      expect(typeof mockRepository.update).toBe('function');
      expect(typeof mockRepository.delete).toBe('function');
      expect(typeof mockRepository.createBulk).toBe('function');
    });

    it('should support async method signatures for Twenty CRM operations', () => {
      const mockRepository: ITribMessageParticipantRepository = {
        create: jest.fn().mockResolvedValue({} as TribMessageParticipant),
        findByMessageId: jest.fn().mockResolvedValue([]),
        findByPersonId: jest.fn().mockResolvedValue([]),
        findByMessageAndPerson: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({} as TribMessageParticipant),
        delete: jest.fn().mockResolvedValue(true),
        createBulk: jest.fn().mockResolvedValue([]),
      };

      // Verify async behavior for TRIB SMS integration
      expect(
        mockRepository.create({} as CreateTribMessageParticipantData),
      ).resolves.toBeDefined();
      expect(mockRepository.findByMessageId('message-123')).resolves.toEqual(
        [],
      );
    });
  });

  describe('TribMessageParticipant Interface', () => {
    it('should accept valid participant data for SMS phone matching', () => {
      const validParticipant: TribMessageParticipant = {
        id: 'participant-123',
        messageId: 'message-456',
        personId: 'person-789',
        role: 'from',
        handle: '+15551234567', // Phone number for TRIB SMS matching
        displayName: 'John Doe',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      expect(validParticipant.id).toBe('participant-123');
      expect(validParticipant.messageId).toBe('message-456');
      expect(validParticipant.personId).toBe('person-789');
      expect(validParticipant.role).toBe('from');
      expect(validParticipant.handle).toBe('+15551234567');
    });

    it('should handle null displayName correctly for TRIB participants', () => {
      const participantWithoutName: TribMessageParticipant = {
        id: 'participant-456',
        messageId: 'message-789',
        personId: 'person-123',
        role: 'to',
        handle: 'user@example.com', // Email handle also supported
        displayName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(participantWithoutName.displayName).toBeNull();
      expect(participantWithoutName.role).toBe('to');
    });

    it('should enforce role type constraints for SMS messages', () => {
      // This test verifies TypeScript type checking at compile time
      const validRoles: Array<TribMessageParticipant['role']> = ['from', 'to'];

      validRoles.forEach((role) => {
        const participant: Partial<TribMessageParticipant> = { role };
        expect(['from', 'to']).toContain(participant.role);
      });
    });
  });

  describe('CreateTribMessageParticipantData Interface', () => {
    it('should accept minimal required data for TRIB SMS creation', () => {
      const createData: CreateTribMessageParticipantData = {
        messageId: 'message-123',
        personId: 'person-456',
        role: 'from',
        handle: '+15551234567', // Phone number for TRIB SMS matching
      };

      expect(createData.messageId).toBe('message-123');
      expect(createData.personId).toBe('person-456');
      expect(createData.role).toBe('from');
      expect(createData.handle).toBe('+15551234567');
      expect(createData.displayName).toBeUndefined();
    });

    it('should accept optional displayName from Twenty CRM Person data', () => {
      const createDataWithName: CreateTribMessageParticipantData = {
        messageId: 'message-789',
        personId: 'person-123',
        role: 'to',
        handle: 'user@example.com',
        displayName: 'Jane Smith',
      };

      expect(createDataWithName.displayName).toBe('Jane Smith');
    });

    it('should not include auto-generated fields for Twenty CRM integration', () => {
      // TypeScript should prevent including id, createdAt, updatedAt
      const createData: CreateTribMessageParticipantData = {
        messageId: 'message-123',
        personId: 'person-456',
        role: 'from',
        handle: '+15551234567',
        // id: 'should-not-be-allowed',        // TypeScript error
        // createdAt: new Date(),              // TypeScript error
        // updatedAt: new Date(),              // TypeScript error
      };

      expect(createData).toBeDefined();
      expect('id' in createData).toBe(false);
      expect('createdAt' in createData).toBe(false);
      expect('updatedAt' in createData).toBe(false);
    });
  });

  describe('TRIB_TOKENS for Twenty CRM Integration', () => {
    it('should include MESSAGE_PARTICIPANT_REPOSITORY token', () => {
      expect(TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY).toBeDefined();
      expect(typeof TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY).toBe('symbol');
    });

    it('should have unique symbol value for DI system', () => {
      const otherSymbol = Symbol('MESSAGE_PARTICIPANT_REPOSITORY');
      expect(TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY).not.toBe(otherSymbol);
    });

    it('should preserve existing PERSON_REPOSITORY token', () => {
      expect(TRIB_TOKENS.PERSON_REPOSITORY).toBeDefined();
      expect(typeof TRIB_TOKENS.PERSON_REPOSITORY).toBe('symbol');
    });

    it('should have distinct token values for TRIB module', () => {
      expect(TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY).not.toBe(
        TRIB_TOKENS.PERSON_REPOSITORY,
      );
    });
  });

  describe('Interface Integration with Twenty CRM', () => {
    it('should support repository factory pattern for TRIB DI system', () => {
      // Verify interfaces work together for Twenty CRM DI system
      const tokenMap = new Map<symbol, any>();

      tokenMap.set(TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY, {
        create: jest.fn(),
        findByMessageId: jest.fn(),
        findByPersonId: jest.fn(),
        findByMessageAndPerson: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createBulk: jest.fn(),
      });

      const repository = tokenMap.get(
        TRIB_TOKENS.MESSAGE_PARTICIPANT_REPOSITORY,
      ) as ITribMessageParticipantRepository;

      expect(repository).toBeDefined();
      expect(typeof repository.create).toBe('function');
    });

    it('should support participant workflow types for TRIB SMS phone matching', () => {
      // Verify types work for typical TRIB SMS participant creation workflow
      const messageId = 'message-123';
      const personId = 'person-456';

      const createData: CreateTribMessageParticipantData = {
        messageId,
        personId,
        role: 'from',
        handle: '+15551234567', // Phone number for TRIB phone matching
        displayName: 'Test User',
      };

      const createdParticipant: TribMessageParticipant = {
        id: 'participant-789',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...createData,
      };

      expect(createdParticipant.messageId).toBe(messageId);
      expect(createdParticipant.personId).toBe(personId);
    });
  });
});

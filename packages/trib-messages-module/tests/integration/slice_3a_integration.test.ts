/**
 * Integration Tests: Slice 3a - Twenty CRM SMS Service Phone Matching Integration
 * 
 * Tests end-to-end SMS processing workflows with phone matching and person linking
 * to verify the complete integration with Twenty CRM Person repository.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TribSmsService, InboundSMSPayload } from '../../src/services/trib_sms.service';
import { ITribMessageRepository } from '../../src/interfaces/trib-message.repository.interface';
import { IPersonRepository, PersonPhone } from '../../src/interfaces/person.repository.interface';
import { TRIB_TOKENS } from '../../src/tokens';
import { TribMessageChannel, TribMessageDirection, TribMessageStatus } from '../../src/types/message-enums';

// Mock phone normalizer to return predictable results
jest.mock('../../src/utils/phone/phone-normalizer', () => ({
  normalizePhoneNumber: jest.fn((phone: string) => {
    if (phone === '+15551234567' || phone === '(555) 123-4567') {
      return '+15551234567';
    }
    if (phone === 'invalid-phone') {
      return null;
    }
    return phone.startsWith('+') ? phone : `+1${phone}`;
  }),
}));

describe('TribSmsService Integration - Slice 3a SMS Phone Matching Workflows', () => {
  let service: TribSmsService;
  let messageRepository: ITribMessageRepository;
  let personRepository: IPersonRepository;
  let messageQueueService: any;

  // Test data representing Twenty CRM entities
  const testPersons: PersonPhone[] = [
    {
      id: 'person-primary-123',
      primaryPhoneNumber: '+15551234567',
      primaryPhoneCountryCode: 'US',
      phone: null,
      additionalPhones: null,
    },
    {
      id: 'person-additional-456',
      primaryPhoneNumber: '+15559876543',
      primaryPhoneCountryCode: 'US',
      phone: null,
      additionalPhones: [
        {
          number: '+15551234567',
          countryCode: 'US',
          callingCode: '+1',
        },
      ],
    },
  ];

  // In-memory repositories for integration testing
  class TestMessageRepository implements ITribMessageRepository {
    private messages: any[] = [];
    private idCounter = 1;

    async findByExternalId(externalId: string) {
      return this.messages.find(m => m.externalId === externalId) || null;
    }

    async create(data: any) {
      const message = {
        ...data,
        id: `message-${this.idCounter++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.messages.push(message);
      return message;
    }

    async findById(id: string) {
      return this.messages.find(m => m.id === id) || null;
    }

    async update(id: string, data: any) {
      const index = this.messages.findIndex(m => m.id === id);
      if (index >= 0) {
        this.messages[index] = { ...this.messages[index], ...data };
        return this.messages[index];
      }
      return null;
    }

    async delete(id: string) {
      const index = this.messages.findIndex(m => m.id === id);
      if (index >= 0) {
        this.messages.splice(index, 1);
        return true;
      }
      return false;
    }

    async findByThreadId(threadId: string) {
      return this.messages.filter(m => m.threadId === threadId);
    }

    async findByContactId(contactId: string) {
      return this.messages.filter(m => m.contactId === contactId);
    }

    async findByStatus(status: any) {
      return this.messages.filter(m => m.status === status);
    }

    // Test helpers
    async findByWorkspace(workspaceId: string) {
      return this.messages.filter(m => m.workspaceId === workspaceId);
    }

    clear() {
      this.messages = [];
      this.idCounter = 1;
    }
  }

  class TestPersonRepository implements IPersonRepository {
    async findByPhone(phoneNumber: string): Promise<PersonPhone | null> {
      return testPersons.find(p => p.primaryPhoneNumber === phoneNumber) || null;
    }

    async findByPhoneVariations(phoneNumbers: string[]): Promise<PersonPhone[]> {
      return testPersons.filter(p => 
        phoneNumbers.includes(p.primaryPhoneNumber || '') ||
        p.additionalPhones?.some(ap => phoneNumbers.includes(ap.number))
      );
    }

    async findByPrimaryOrAdditionalPhone(phoneNumber: string): Promise<PersonPhone | null> {
      // Search primary phone
      let person = testPersons.find(p => p.primaryPhoneNumber === phoneNumber);
      if (person) return person;

      // Search additional phones  
      person = testPersons.find(p => 
        p.additionalPhones?.some(ap => ap.number === phoneNumber)
      );
      return person || null;
    }
  }

  beforeEach(async () => {
    const testMessageRepo = new TestMessageRepository();
    const testPersonRepo = new TestPersonRepository();

    messageQueueService = {
      add: jest.fn(),
      addCron: jest.fn(),
      removeCron: jest.fn(),
      work: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TribSmsService,
        {
          provide: TRIB_TOKENS.MESSAGE_REPOSITORY,
          useValue: testMessageRepo,
        },
        {
          provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
          useValue: messageQueueService,
        },
        {
          provide: TRIB_TOKENS.PERSON_REPOSITORY,
          useValue: testPersonRepo,
        },
      ],
    }).compile();

    service = module.get<TribSmsService>(TribSmsService);
    messageRepository = module.get<ITribMessageRepository>(TRIB_TOKENS.MESSAGE_REPOSITORY);
    personRepository = module.get<IPersonRepository>(TRIB_TOKENS.PERSON_REPOSITORY);

    // Clear test data
    (messageRepository as TestMessageRepository).clear();
  });

  describe('End-to-End SMS Processing with Twenty CRM Person Matching', () => {
    const workspaceId = 'twenty-workspace-123';

    it('should complete full workflow: SMS → Phone Normalization → Person Lookup → Message Creation with Link', async () => {
      // Arrange: SMS from phone that matches primary phone in Twenty CRM
      const smsPayload: InboundSMSPayload = {
        From: '+15551234567', // matches testPersons[0].primaryPhoneNumber
        To: '+18777804236',
        Body: 'Integration test message for Twenty CRM',
        MessageSid: 'SM_integration_test_001',
        AccountSid: 'AC123456789',
      };

      // Act: Process the SMS
      const result = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Successful processing
      expect(result).toBe(true);

      // Verify message was created with Person link
      const createdMessage = await messageRepository.findByExternalId('SM_integration_test_001');
      expect(createdMessage).toBeTruthy();
      expect(createdMessage!.contactId).toBe('person-primary-123'); // ✨ Person linked
      expect(createdMessage!.content).toBe('Integration test message for Twenty CRM');
      expect(createdMessage!.from).toBe('+15551234567'); // normalized phone
      expect(createdMessage!.channel).toBe(TribMessageChannel.SMS);
      expect(createdMessage!.direction).toBe(TribMessageDirection.INBOUND);
      expect(createdMessage!.status).toBe(TribMessageStatus.DELIVERED);
    });

    it('should match person via additional phone numbers in Twenty CRM', async () => {
      // Arrange: SMS from phone that matches additional phone in Twenty CRM
      const smsPayload: InboundSMSPayload = {
        From: '+15551234567', // matches testPersons[1].additionalPhones[0].number  
        To: '+18777804236',
        Body: 'SMS to additional phone in Twenty CRM',
        MessageSid: 'SM_integration_test_002',
        AccountSid: 'AC123456789',
      };

      // Act: Process the SMS
      const result = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Successfully matched via additional phone
      expect(result).toBe(true);

      const createdMessage = await messageRepository.findByExternalId('SM_integration_test_002');
      expect(createdMessage).toBeTruthy();
      // Should match first person found (primary phone has precedence)
      expect(createdMessage!.contactId).toBe('person-primary-123');
    });

    it('should handle unknown phone numbers gracefully in Twenty CRM', async () => {
      // Arrange: SMS from unknown phone number
      const smsPayload: InboundSMSPayload = {
        From: '+15559999999', // not in Twenty CRM
        To: '+18777804236',
        Body: 'SMS from unknown phone number',
        MessageSid: 'SM_integration_test_003',
        AccountSid: 'AC123456789',
      };

      // Act: Process the SMS
      const result = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Successful processing without person link
      expect(result).toBe(true);

      const createdMessage = await messageRepository.findByExternalId('SM_integration_test_003');
      expect(createdMessage).toBeTruthy();
      expect(createdMessage!.contactId).toBeNull(); // No person link
      expect(createdMessage!.content).toBe('SMS from unknown phone number');
      expect(createdMessage!.from).toBe('+15559999999');
    });

    it('should handle phone normalization failure in integration workflow', async () => {
      // Arrange: SMS with invalid phone format
      const smsPayload: InboundSMSPayload = {
        From: 'invalid-phone', // will fail normalization
        To: '+18777804236',
        Body: 'SMS with invalid phone format',
        MessageSid: 'SM_integration_test_004',
        AccountSid: 'AC123456789',
      };

      // Act: Process the SMS
      const result = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Successful processing with original phone
      expect(result).toBe(true);

      const createdMessage = await messageRepository.findByExternalId('SM_integration_test_004');
      expect(createdMessage).toBeTruthy();
      expect(createdMessage!.contactId).toBeNull(); // No person lookup attempted
      expect(createdMessage!.from).toBe('invalid-phone'); // original phone preserved
    });

    it('should prevent duplicate message processing in integration workflow', async () => {
      // Arrange: Same SMS payload sent twice
      const smsPayload: InboundSMSPayload = {
        From: '+15551234567',
        To: '+18777804236',
        Body: 'Duplicate message test',
        MessageSid: 'SM_integration_test_005',
        AccountSid: 'AC123456789',
      };

      // Act: Process SMS twice
      const result1 = await service.processInboundSMS(smsPayload, workspaceId);
      const result2 = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Both successful, but only one message created
      expect(result1).toBe(true);
      expect(result2).toBe(true);

      // Verify only one message exists
      const allMessages = await (messageRepository as any).findByWorkspace(workspaceId);
      const duplicateMessages = allMessages.filter((m: any) => m.externalId === 'SM_integration_test_005');
      expect(duplicateMessages).toHaveLength(1);
    });

    it('should handle different phone formats consistently', async () => {
      // Arrange: SMS with different phone format that normalizes to same number
      const smsPayload: InboundSMSPayload = {
        From: '(555) 123-4567', // will normalize to +15551234567
        To: '+18777804236',
        Body: 'Different phone format test',
        MessageSid: 'SM_integration_test_006',
        AccountSid: 'AC123456789',
      };

      // Act: Process the SMS
      const result = await service.processInboundSMS(smsPayload, workspaceId);

      // Assert: Successful processing with person match
      expect(result).toBe(true);

      const createdMessage = await messageRepository.findByExternalId('SM_integration_test_006');
      expect(createdMessage).toBeTruthy();
      expect(createdMessage!.contactId).toBe('person-primary-123'); // Person matched
      expect(createdMessage!.from).toBe('+15551234567'); // normalized format
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle repository failures gracefully', async () => {
      // Arrange: Mock repository to simulate error
      const errorPersonRepo = {
        findByPhone: jest.fn(),
        findByPhoneVariations: jest.fn(),
        findByPrimaryOrAdditionalPhone: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: TRIB_TOKENS.MESSAGE_REPOSITORY,
            useValue: messageRepository,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: messageQueueService,
          },
          {
            provide: TRIB_TOKENS.PERSON_REPOSITORY,
            useValue: errorPersonRepo,
          },
        ],
      }).compile();

      const errorService = module.get<TribSmsService>(TribSmsService);

      const smsPayload: InboundSMSPayload = {
        From: '+15551234567',
        To: '+18777804236',
        Body: 'Error handling test',
        MessageSid: 'SM_integration_error_001',
        AccountSid: 'AC123456789',
      };

      // Act: Process SMS with failing repository
      const result = await errorService.processInboundSMS(smsPayload, 'test-workspace');

      // Assert: Processing continues despite person lookup failure
      expect(result).toBe(true);

      const createdMessage = await messageRepository.findByExternalId('SM_integration_error_001');
      expect(createdMessage).toBeTruthy();
      expect(createdMessage!.contactId).toBeNull(); // No person link due to error
      expect(createdMessage!.content).toBe('Error handling test');
    });
  });

  describe('Integration Performance and Reliability', () => {
    it('should process multiple SMS messages efficiently', async () => {
      // Arrange: Multiple SMS payloads
      const smsPayloads: InboundSMSPayload[] = Array.from({ length: 10 }, (_, i) => ({
        From: '+15551234567',
        To: '+18777804236',
        Body: `Bulk test message ${i + 1}`,
        MessageSid: `SM_bulk_test_${String(i + 1).padStart(3, '0')}`,
        AccountSid: 'AC123456789',
      }));

      const startTime = Date.now();

      // Act: Process all messages
      const results = await Promise.all(
        smsPayloads.map((payload, index) => 
          service.processInboundSMS(payload, `workspace-${index % 3}`)
        )
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Assert: All messages processed successfully
      expect(results.every(r => r === true)).toBe(true);
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify all messages were created with person links
      for (let i = 0; i < 10; i++) {
        const messageId = `SM_bulk_test_${String(i + 1).padStart(3, '0')}`;
        const message = await messageRepository.findByExternalId(messageId);
        expect(message).toBeTruthy();
        expect(message!.contactId).toBe('person-primary-123'); // All should link to same person
      }
    });
  });
});
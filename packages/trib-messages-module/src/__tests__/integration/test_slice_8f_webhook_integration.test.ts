import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { createHmac } from 'crypto';
import { TribWebhookController } from '../../controllers/trib-webhook.controller';
import { TwilioSignatureValidationMiddleware } from '../../middleware/twilio-signature-validation.middleware';
import {
  TribDeliveryWorkspaceEntity,
  TribDeliveryStatus,
} from '../../standard-objects/trib-delivery.workspace-entity';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';

// Test constants for integration testing
const TEST_MESSAGE_SID = 'SMintegration123456789';
const TEST_ACCOUNT_SID = 'ACintegration123456789';
const TEST_PHONE_FROM = '+15551111111';
const TEST_PHONE_TO = '+15552222222';
const TEST_DELIVERY_ID = 'integration-delivery-123';
const TEST_AUTH_TOKEN = 'integration_auth_token_12345';
const TEST_WEBHOOK_URL =
  'https://api.test.com/webhooks/trib/twilio/delivery-status';
const VALID_WEBHOOK_TIMEOUT = 30000; // 30 seconds for integration test
const DATABASE_OPERATION_TIMEOUT = 5000; // 5 seconds for DB operations

describe('TribWebhookController Integration Tests', () => {
  let app: TestingModule;
  let controller: TribWebhookController;
  let middleware: TwilioSignatureValidationMiddleware;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockConfigService: jest.Mocked<ConfigService>;

  /**
   * Generate valid Twilio signature for integration testing
   */
  const generateValidTwilioSignature = (
    url: string,
    payload: string,
    authToken: string,
  ): string => {
    const hmac = createHmac('sha1', authToken);
    hmac.update(url + payload);
    return hmac.digest('base64');
  };

  /**
   * Create form-encoded webhook payload as Twilio sends it
   */
  const createFormEncodedPayload = (data: Record<string, string>): string => {
    return Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
  };

  /**
   * Create mock delivery entity for testing
   */
  const createMockDeliveryEntity = (
    overrides: Partial<TribDeliveryWorkspaceEntity> = {},
  ): TribDeliveryWorkspaceEntity => {
    return {
      id: TEST_DELIVERY_ID,
      externalDeliveryId: TEST_MESSAGE_SID,
      status: TribDeliveryStatus.SENT,
      errorCode: undefined,
      errorMessage: undefined,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      message: {} as TribMessageWorkspaceEntity,
      ...overrides,
    } as TribDeliveryWorkspaceEntity;
  };

  beforeEach(async () => {
    // Mock EntityManager
    mockEntityManager = {
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;

    // Mock QueryRunner with proper transaction handling
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: mockEntityManager,
    } as any;

    // Mock DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'TWILIO_AUTH_TOKEN') return TEST_AUTH_TOKEN;
        return undefined;
      }),
    } as any;

    // Create testing module with all dependencies
    app = await Test.createTestingModule({
      controllers: [TribWebhookController],
      providers: [
        TwilioSignatureValidationMiddleware,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = app.get<TribWebhookController>(TribWebhookController);
    middleware = app.get<TwilioSignatureValidationMiddleware>(
      TwilioSignatureValidationMiddleware,
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  describe('End-to-End Webhook Processing', () => {
    it(
      'should process complete delivery status webhook workflow',
      async () => {
        // Arrange: Create webhook payload as Twilio would send it
        const webhookData = {
          MessageSid: TEST_MESSAGE_SID,
          AccountSid: TEST_ACCOUNT_SID,
          MessageStatus: 'delivered',
          To: TEST_PHONE_TO,
          From: TEST_PHONE_FROM,
          Body: 'Integration test message',
          DateCreated: new Date().toISOString(),
          DateUpdated: new Date().toISOString(),
        };

        const formPayload = createFormEncodedPayload(webhookData);
        const validSignature = generateValidTwilioSignature(
          TEST_WEBHOOK_URL,
          formPayload,
          TEST_AUTH_TOKEN,
        );

        // Mock database entities
        const mockDelivery = createMockDeliveryEntity({
          status: TribDeliveryStatus.SENT,
        });

        mockEntityManager.findOne.mockResolvedValue(mockDelivery);
        mockEntityManager.update.mockResolvedValue({ affected: 1 } as any);

        // Mock Express request and response
        const mockRequest = {
          headers: { 'x-twilio-signature': validSignature },
          originalUrl: '/webhooks/trib/twilio/delivery-status',
          protocol: 'https',
          get: jest.fn().mockImplementation((header: string) => {
            if (header === 'host') return 'api.test.com';
            return undefined;
          }),
          rawBody: formPayload,
          body: webhookData,
        } as any;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;

        // Act: Process the webhook through the complete pipeline
        await controller.handleDeliveryStatus(
          webhookData,
          validSignature,
          mockRequest,
          mockResponse,
        );

        // Assert: Verify complete workflow execution
        expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);

        expect(mockEntityManager.findOne).toHaveBeenCalledWith(
          TribDeliveryWorkspaceEntity,
          {
            where: { externalDeliveryId: TEST_MESSAGE_SID },
            relations: ['message'],
          },
        );

        expect(mockEntityManager.update).toHaveBeenCalledWith(
          TribDeliveryWorkspaceEntity,
          TEST_DELIVERY_ID,
          expect.objectContaining({
            status: TribDeliveryStatus.DELIVERED,
            metadata: expect.objectContaining({
              twilioStatus: 'delivered',
            }),
          }),
        );

        expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusUpdated: true,
            deliveryId: TEST_DELIVERY_ID,
            newStatus: 'DELIVERED',
          }),
        );
      },
      VALID_WEBHOOK_TIMEOUT,
    );

    it(
      'should handle failed delivery webhook with error details',
      async () => {
        // Arrange: Create failed delivery webhook
        const webhookData = {
          MessageSid: TEST_MESSAGE_SID,
          AccountSid: TEST_ACCOUNT_SID,
          MessageStatus: 'failed',
          To: TEST_PHONE_TO,
          From: TEST_PHONE_FROM,
          ErrorCode: '30008',
          ErrorMessage: 'Unknown error',
          DateCreated: new Date().toISOString(),
          DateUpdated: new Date().toISOString(),
        };

        const formPayload = createFormEncodedPayload(webhookData);
        const validSignature = generateValidTwilioSignature(
          TEST_WEBHOOK_URL,
          formPayload,
          TEST_AUTH_TOKEN,
        );

        const mockDelivery = createMockDeliveryEntity({
          status: TribDeliveryStatus.SENT,
        });

        mockEntityManager.findOne.mockResolvedValue(mockDelivery);
        mockEntityManager.update.mockResolvedValue({ affected: 1 } as any);

        const mockRequest = {
          headers: { 'x-twilio-signature': validSignature },
          originalUrl: '/webhooks/trib/twilio/delivery-status',
          protocol: 'https',
          get: jest.fn().mockReturnValue('api.test.com'),
          rawBody: formPayload,
          body: webhookData,
        } as any;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;

        // Act: Process failed delivery webhook
        await controller.handleDeliveryStatus(
          webhookData,
          validSignature,
          mockRequest,
          mockResponse,
        );

        // Assert: Verify error details are captured
        expect(mockEntityManager.update).toHaveBeenCalledWith(
          TribDeliveryWorkspaceEntity,
          TEST_DELIVERY_ID,
          expect.objectContaining({
            status: TribDeliveryStatus.FAILED,
            errorCode: '30008',
            errorMessage: 'Unknown error',
            metadata: expect.objectContaining({
              twilioStatus: 'failed',
            }),
          }),
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      },
      VALID_WEBHOOK_TIMEOUT,
    );

    it(
      'should rollback transaction on database errors',
      async () => {
        // Arrange: Setup scenario that will cause database error
        const webhookData = {
          MessageSid: TEST_MESSAGE_SID,
          AccountSid: TEST_ACCOUNT_SID,
          MessageStatus: 'delivered',
          To: TEST_PHONE_TO,
          From: TEST_PHONE_FROM,
        };

        const formPayload = createFormEncodedPayload(webhookData);
        const validSignature = generateValidTwilioSignature(
          TEST_WEBHOOK_URL,
          formPayload,
          TEST_AUTH_TOKEN,
        );

        const mockDelivery = createMockDeliveryEntity();

        mockEntityManager.findOne.mockResolvedValue(mockDelivery);
        mockEntityManager.update.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const mockRequest = {
          headers: { 'x-twilio-signature': validSignature },
          originalUrl: '/webhooks/trib/twilio/delivery-status',
          protocol: 'https',
          get: jest.fn().mockReturnValue('api.test.com'),
          rawBody: formPayload,
          body: webhookData,
        } as any;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;

        // Act: Process webhook that will fail
        await controller.handleDeliveryStatus(
          webhookData,
          validSignature,
          mockRequest,
          mockResponse,
        );

        // Assert: Verify transaction rollback
        expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
      },
      DATABASE_OPERATION_TIMEOUT,
    );

    it(
      'should handle multiple delivery status updates idempotently',
      async () => {
        // Arrange: Setup duplicate webhook scenario
        const webhookData = {
          MessageSid: TEST_MESSAGE_SID,
          AccountSid: TEST_ACCOUNT_SID,
          MessageStatus: 'delivered',
          To: TEST_PHONE_TO,
          From: TEST_PHONE_FROM,
        };

        const formPayload = createFormEncodedPayload(webhookData);
        const validSignature = generateValidTwilioSignature(
          TEST_WEBHOOK_URL,
          formPayload,
          TEST_AUTH_TOKEN,
        );

        // Mock delivery that already has the target status
        const mockDelivery = createMockDeliveryEntity({
          status: TribDeliveryStatus.DELIVERED, // Already delivered
        });

        mockEntityManager.findOne.mockResolvedValue(mockDelivery);

        const mockRequest = {
          headers: { 'x-twilio-signature': validSignature },
          originalUrl: '/webhooks/trib/twilio/delivery-status',
          protocol: 'https',
          get: jest.fn().mockReturnValue('api.test.com'),
          rawBody: formPayload,
          body: webhookData,
        } as any;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;

        // Act: Process duplicate webhook
        await controller.handleDeliveryStatus(
          webhookData,
          validSignature,
          mockRequest,
          mockResponse,
        );

        // Assert: Verify idempotent behavior
        expect(mockEntityManager.update).not.toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusUpdated: false,
            deliveryId: TEST_DELIVERY_ID,
          }),
        );
      },
      VALID_WEBHOOK_TIMEOUT,
    );

    it(
      'should validate workspace context through delivery lookup',
      async () => {
        // Arrange: Create webhook for non-existent delivery
        const webhookData = {
          MessageSid: 'SM_nonexistent_message',
          AccountSid: TEST_ACCOUNT_SID,
          MessageStatus: 'delivered',
          To: TEST_PHONE_TO,
          From: TEST_PHONE_FROM,
        };

        const formPayload = createFormEncodedPayload(webhookData);
        const validSignature = generateValidTwilioSignature(
          TEST_WEBHOOK_URL,
          formPayload,
          TEST_AUTH_TOKEN,
        );

        // Mock no delivery found
        mockEntityManager.findOne.mockResolvedValue(null);

        const mockRequest = {
          headers: { 'x-twilio-signature': validSignature },
          originalUrl: '/webhooks/trib/twilio/delivery-status',
          protocol: 'https',
          get: jest.fn().mockReturnValue('api.test.com'),
          rawBody: formPayload,
          body: webhookData,
        } as any;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;

        // Act: Process webhook for non-existent delivery
        await controller.handleDeliveryStatus(
          webhookData,
          validSignature,
          mockRequest,
          mockResponse,
        );

        // Assert: Verify proper error handling
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Delivery record not found'),
          }),
        );
      },
      VALID_WEBHOOK_TIMEOUT,
    );
  });
});

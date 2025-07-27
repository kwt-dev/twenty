import {
  TribPhoneNumberWorkspaceEntity,
  TribPhoneNumberType,
  TribPhoneNumberStatus,
  TribVerificationMethod,
} from '../../standard-objects/trib-phone-number.workspace-entity';

import {
  TribDeliveryWorkspaceEntity,
  TribDeliveryStatus,
  TribCallbackStatus,
} from '../../standard-objects/trib-delivery.workspace-entity';

import {
  validateProviderCapabilities,
  getProviderCapabilities,
  isValidProvider,
  MessageProvider,
  MessageCapability,
} from '../../utils/validation/provider-validator';

describe('TRIB Phone Number and Delivery Integration Tests', () => {
  describe('Provider capability validation workflow', () => {
    it('should validate complete Twilio provider setup', () => {
      // Create phone number with Twilio capabilities
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+12345678901';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;
      phoneNumber.capabilities = ['SMS', 'MMS', 'VOICE'];
      phoneNumber.validated = true;

      // Validate provider capabilities
      const provider = 'TWILIO';
      const isValidSetup = TribPhoneNumberWorkspaceEntity.validateCapabilities(
        provider,
        phoneNumber.capabilities!,
      );

      expect(isValidSetup).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateE164Format(phoneNumber.number),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(phoneNumber.status),
      ).toBe(true);

      // Create delivery for this provider
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-123';
      delivery.provider = provider;
      delivery.status = TribDeliveryStatus.QUEUED;
      delivery.attempts = 0;

      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(true);
      expect(
        validateProviderCapabilities(provider, phoneNumber.capabilities!),
      ).toBe(true);
    });

    it('should validate AWS SNS SMS-only setup', () => {
      // Create phone number with SMS capability only
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+19876543210';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.VERIFIED;
      phoneNumber.capabilities = ['SMS'];
      phoneNumber.validated = true;

      // Validate AWS SNS provider
      const provider = 'AWS_SNS';
      const isValidSetup = TribPhoneNumberWorkspaceEntity.validateCapabilities(
        provider,
        phoneNumber.capabilities!,
      );

      expect(isValidSetup).toBe(true);

      // Should reject MMS for AWS SNS
      const invalidCapabilities = ['SMS', 'MMS'];
      const isInvalidSetup =
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          provider,
          invalidCapabilities,
        );
      expect(isInvalidSetup).toBe(false);

      // Create delivery for AWS SNS
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-456';
      delivery.provider = provider;
      delivery.status = TribDeliveryStatus.QUEUED;

      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(true);
    });

    it('should validate Azure Communication Services setup', () => {
      // Create phone number with SMS and MMS capabilities
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+14567890123';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;
      phoneNumber.capabilities = ['SMS', 'MMS'];
      phoneNumber.validated = true;

      // Validate Azure provider
      const provider = 'AZURE_COMMUNICATION';
      const isValidSetup = TribPhoneNumberWorkspaceEntity.validateCapabilities(
        provider,
        phoneNumber.capabilities!,
      );

      expect(isValidSetup).toBe(true);

      // Should reject Voice for Azure Communication Services
      const invalidCapabilities = ['SMS', 'MMS', 'VOICE'];
      const isInvalidSetup =
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          provider,
          invalidCapabilities,
        );
      expect(isInvalidSetup).toBe(false);

      // Create delivery for Azure
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-789';
      delivery.provider = provider;
      delivery.status = TribDeliveryStatus.ACCEPTED;

      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(true);
    });
  });

  describe('Phone number type and capability validation', () => {
    it('should validate mobile phone capabilities across providers', () => {
      const mobileNumber = new TribPhoneNumberWorkspaceEntity();
      mobileNumber.number = '+15551234567';
      mobileNumber.type = TribPhoneNumberType.MOBILE;

      // Mobile should support all capabilities
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          mobileNumber.type,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          mobileNumber.type,
          'MMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          mobileNumber.type,
          'VOICE',
        ),
      ).toBe(true);

      // Test with different providers
      const providers = ['TWILIO', 'AWS_SNS', 'AZURE_COMMUNICATION'];

      providers.forEach((provider) => {
        const supportedCapabilities = getProviderCapabilities(provider);
        const phoneCapabilities = supportedCapabilities.filter((cap) =>
          TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
            mobileNumber.type,
            cap,
          ),
        );

        expect(
          TribPhoneNumberWorkspaceEntity.validateCapabilities(
            provider,
            phoneCapabilities,
          ),
        ).toBe(true);
      });
    });

    it('should validate landline phone limitations', () => {
      const landlineNumber = new TribPhoneNumberWorkspaceEntity();
      landlineNumber.number = '+15551234568';
      landlineNumber.type = TribPhoneNumberType.LANDLINE;

      // Landline only supports voice
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          landlineNumber.type,
          'SMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          landlineNumber.type,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          landlineNumber.type,
          'VOICE',
        ),
      ).toBe(true);

      // Only TWILIO supports voice capability
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', [
          'VOICE',
        ]),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', [
          'VOICE',
        ]),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'AZURE_COMMUNICATION',
          ['VOICE'],
        ),
      ).toBe(false);
    });

    it('should validate toll-free number capabilities', () => {
      const tollFreeNumber = new TribPhoneNumberWorkspaceEntity();
      tollFreeNumber.number = '+18005551234';
      tollFreeNumber.type = TribPhoneNumberType.TOLL_FREE;

      // Toll-free supports SMS and Voice but not MMS
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          tollFreeNumber.type,
          'SMS',
        ),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          tollFreeNumber.type,
          'MMS',
        ),
      ).toBe(false);
      expect(
        TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
          tollFreeNumber.type,
          'VOICE',
        ),
      ).toBe(true);

      // Test with providers that support both SMS and Voice
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('TWILIO', [
          'SMS',
          'VOICE',
        ]),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', ['SMS']),
      ).toBe(true);
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities('AWS_SNS', [
          'VOICE',
        ]),
      ).toBe(false);
    });
  });

  describe('Message delivery workflow integration', () => {
    it('should handle complete outbound message delivery lifecycle', () => {
      // Setup phone number
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+12025551234';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.VERIFIED;
      phoneNumber.capabilities = ['SMS', 'MMS'];
      phoneNumber.verificationMethod = TribVerificationMethod.SMS_CODE;

      // Setup delivery tracking
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-outbound-123';
      delivery.provider = 'TWILIO';
      delivery.status = TribDeliveryStatus.QUEUED;
      delivery.attempts = 0;
      delivery.webhookUrl = 'https://api.example.com/webhooks/delivery';
      delivery.callbackStatus = TribCallbackStatus.PENDING;

      // Validate initial setup
      expect(
        TribPhoneNumberWorkspaceEntity.canSendMessages(phoneNumber.status),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.validateWebhookUrl(delivery.webhookUrl!),
      ).toBe(true);

      // Simulate delivery progression
      const deliveryFlow = [
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.DELIVERED,
      ];

      for (let i = 0; i < deliveryFlow.length - 1; i++) {
        const currentStatus = deliveryFlow[i];
        const nextStatus = deliveryFlow[i + 1];

        expect(
          TribDeliveryWorkspaceEntity.isValidTransition(
            currentStatus,
            nextStatus,
          ),
        ).toBe(true);
        expect(
          TribDeliveryWorkspaceEntity.isTerminalStatus(currentStatus),
        ).toBe(false);
      }

      // Final status should be terminal
      const finalStatus = deliveryFlow[deliveryFlow.length - 1];
      expect(TribDeliveryWorkspaceEntity.isTerminalStatus(finalStatus)).toBe(
        true,
      );
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(finalStatus),
      ).toBe(true);
    });

    it('should handle failed delivery with retry logic', () => {
      // Setup phone number
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+13015551234';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;

      // Setup delivery that will fail
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-retry-456';
      delivery.provider = 'TWILIO';
      delivery.status = TribDeliveryStatus.FAILED;
      delivery.attempts = 1;
      delivery.errorCode = '30008';
      delivery.errorMessage = 'Unknown error';

      const maxRetries = 3;

      // Test retry logic
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          delivery.status,
          delivery.attempts,
          maxRetries,
        ),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          delivery.status,
          TribDeliveryStatus.QUEUED,
        ),
      ).toBe(true);

      // Simulate retry attempts
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const canRetry = TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.FAILED,
          attempt,
          maxRetries,
        );

        if (attempt < maxRetries) {
          expect(canRetry).toBe(true);
        } else {
          expect(canRetry).toBe(false);
        }
      }

      // Test final failure state
      delivery.attempts = maxRetries;
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          delivery.status,
          delivery.attempts,
          maxRetries,
        ),
      ).toBe(false);
      expect(
        TribDeliveryWorkspaceEntity.isFailedDelivery(delivery.status),
      ).toBe(true);
    });

    it('should handle inbound message reception workflow', () => {
      // Setup phone number for inbound messages
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+14155551234';
      phoneNumber.type = TribPhoneNumberType.MOBILE;
      phoneNumber.status = TribPhoneNumberStatus.ACTIVE;
      phoneNumber.capabilities = ['SMS'];

      // Setup inbound delivery tracking
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-inbound-789';
      delivery.provider = 'TWILIO';
      delivery.status = TribDeliveryStatus.RECEIVING;
      delivery.attempts = 0;

      // Validate inbound flow
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          delivery.status,
          TribDeliveryStatus.RECEIVED,
        ),
      ).toBe(true);

      delivery.status = TribDeliveryStatus.RECEIVED;
      expect(
        TribDeliveryWorkspaceEntity.isTerminalStatus(delivery.status),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(delivery.status),
      ).toBe(true);
    });
  });

  describe('Webhook and callback integration', () => {
    it('should validate webhook processing workflow', () => {
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-webhook-123';
      delivery.provider = 'TWILIO';
      delivery.webhookUrl = 'https://secure.example.com/webhooks/delivery';
      delivery.callbackStatus = TribCallbackStatus.PENDING;

      // Validate webhook URL
      expect(
        TribDeliveryWorkspaceEntity.validateWebhookUrl(delivery.webhookUrl!),
      ).toBe(true);

      // Simulate webhook processing
      delivery.callbackStatus = TribCallbackStatus.PROCESSING;
      delivery.metadata = {
        webhookReceived: new Date().toISOString(),
        webhookPayload: {
          MessageSid: 'SM123abc',
          MessageStatus: 'delivered',
          To: '+12345678901',
          From: '+19876543210',
        },
      };

      // Complete webhook processing
      delivery.callbackStatus = TribCallbackStatus.COMPLETED;
      delivery.status = TribDeliveryStatus.DELIVERED;
      delivery.timestamp = new Date();

      expect(delivery.callbackStatus).toBe(TribCallbackStatus.COMPLETED);
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(delivery.status),
      ).toBe(true);
    });

    it('should handle webhook retry scenarios', () => {
      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.messageId = 'msg-webhook-retry-456';
      delivery.webhookUrl = 'https://api.example.com/webhooks/unreliable';
      delivery.callbackStatus = TribCallbackStatus.FAILED;

      // Simulate webhook retry
      delivery.callbackStatus = TribCallbackStatus.RETRYING;
      delivery.metadata = {
        webhookRetries: 2,
        lastRetryAt: new Date().toISOString(),
        lastError: 'Connection timeout',
      };

      // Eventually abandon if retries exhausted
      delivery.callbackStatus = TribCallbackStatus.ABANDONED;

      expect(delivery.callbackStatus).toBe(TribCallbackStatus.ABANDONED);
    });
  });

  describe('Cross-provider compatibility validation', () => {
    it('should validate provider switching scenarios', () => {
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+15105551234';
      phoneNumber.type = TribPhoneNumberType.MOBILE;

      // Test capability matrix for each provider
      const testCases = [
        {
          provider: 'TWILIO',
          supportedCapabilities: ['SMS', 'MMS', 'VOICE'],
          unsupportedCapabilities: [],
        },
        {
          provider: 'AWS_SNS',
          supportedCapabilities: ['SMS'],
          unsupportedCapabilities: ['MMS', 'VOICE'],
        },
        {
          provider: 'AZURE_COMMUNICATION',
          supportedCapabilities: ['SMS', 'MMS'],
          unsupportedCapabilities: ['VOICE'],
        },
      ];

      testCases.forEach((testCase) => {
        // Validate supported capabilities
        testCase.supportedCapabilities.forEach((capability) => {
          expect(
            validateProviderCapabilities(testCase.provider, [capability]),
          ).toBe(true);
        });

        // Validate unsupported capabilities
        testCase.unsupportedCapabilities.forEach((capability) => {
          expect(
            validateProviderCapabilities(testCase.provider, [capability]),
          ).toBe(false);
        });

        // Validate provider is recognized
        expect(isValidProvider(testCase.provider)).toBe(true);
      });
    });

    it('should calculate delivery success rates across providers', () => {
      // Simulate delivery results from different providers
      const twilioDeliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.DELIVERED,
      ];

      const awsDeliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.DELIVERED,
      ];

      const azureDeliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.UNDELIVERED,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.FAILED,
      ];

      const twilioSuccessRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(twilioDeliveries);
      const awsSuccessRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(awsDeliveries);
      const azureSuccessRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(azureDeliveries);

      expect(twilioSuccessRate).toBe(75); // 3 out of 4
      expect(awsSuccessRate).toBe(100); // 3 out of 3
      expect(azureSuccessRate).toBe(50); // 2 out of 4

      // Overall success rate
      const allDeliveries = [
        ...twilioDeliveries,
        ...awsDeliveries,
        ...azureDeliveries,
      ];
      const overallSuccessRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(allDeliveries);
      expect(overallSuccessRate).toBe(73); // 8 out of 11 successful
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid provider configurations gracefully', () => {
      const phoneNumber = new TribPhoneNumberWorkspaceEntity();
      phoneNumber.number = '+16505551234';
      phoneNumber.capabilities = ['SMS', 'INVALID_CAPABILITY'];

      // Should reject invalid capabilities
      expect(
        TribPhoneNumberWorkspaceEntity.validateCapabilities(
          'TWILIO',
          phoneNumber.capabilities!,
        ),
      ).toBe(false);

      const delivery = new TribDeliveryWorkspaceEntity();
      delivery.provider = 'INVALID_PROVIDER';

      // Should reject invalid provider
      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(false);
    });

    it('should validate complex real-world scenarios', () => {
      // Scenario: High-volume SMS campaign with multiple providers
      const campaignPhoneNumbers = [
        {
          number: '+12125551001',
          type: TribPhoneNumberType.TOLL_FREE,
          provider: 'TWILIO',
          capabilities: ['SMS'],
        },
        {
          number: '+12125551002',
          type: TribPhoneNumberType.SHORT_CODE,
          provider: 'TWILIO',
          capabilities: ['SMS', 'MMS'],
        },
      ];

      campaignPhoneNumbers.forEach((config) => {
        const phoneNumber = new TribPhoneNumberWorkspaceEntity();
        phoneNumber.number = config.number;
        phoneNumber.type = config.type;
        phoneNumber.capabilities = config.capabilities;

        // Validate E.164 format
        expect(
          TribPhoneNumberWorkspaceEntity.validateE164Format(phoneNumber.number),
        ).toBe(true);

        // Validate type supports required capabilities
        config.capabilities.forEach((capability) => {
          expect(
            TribPhoneNumberWorkspaceEntity.typeSupportsCapability(
              phoneNumber.type,
              capability,
            ),
          ).toBe(true);
        });

        // Validate provider supports capabilities
        expect(
          TribPhoneNumberWorkspaceEntity.validateCapabilities(
            config.provider,
            config.capabilities,
          ),
        ).toBe(true);
      });
    });
  });
});

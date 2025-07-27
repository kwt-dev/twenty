import {
  TribDeliveryWorkspaceEntity,
  TribDeliveryStatus,
  TribCallbackStatus,
} from '../standard-objects/trib-delivery.workspace-entity';

describe('TribDeliveryWorkspaceEntity', () => {
  let delivery: TribDeliveryWorkspaceEntity;

  beforeEach(() => {
    delivery = new TribDeliveryWorkspaceEntity();
  });

  describe('Entity creation and basic properties', () => {
    it('should create a new delivery entity', () => {
      expect(delivery).toBeInstanceOf(TribDeliveryWorkspaceEntity);
    });

    it('should allow setting required fields', () => {
      delivery.messageId = 'msg-123';
      delivery.status = TribDeliveryStatus.QUEUED;
      delivery.provider = 'TWILIO';
      delivery.attempts = 1;
      delivery.callbackStatus = TribCallbackStatus.PENDING;

      expect(delivery.messageId).toBe('msg-123');
      expect(delivery.status).toBe(TribDeliveryStatus.QUEUED);
      expect(delivery.provider).toBe('TWILIO');
      expect(delivery.attempts).toBe(1);
      expect(delivery.callbackStatus).toBe(TribCallbackStatus.PENDING);
    });

    it('should allow setting optional fields', () => {
      const testDate = new Date();
      const testMetadata = { twilioSid: 'SM123abc', webhookId: 'wh-456' };

      delivery.timestamp = testDate;
      delivery.errorCode = '30008';
      delivery.errorMessage = 'Unknown error';
      delivery.cost = 750; // 7.5 cents in USD
      delivery.latency = 250;
      delivery.webhookUrl = 'https://example.com/webhook';
      delivery.externalDeliveryId = 'SM123abc456def';
      delivery.metadata = testMetadata;

      expect(delivery.timestamp).toBe(testDate);
      expect(delivery.errorCode).toBe('30008');
      expect(delivery.errorMessage).toBe('Unknown error');
      expect(delivery.cost).toBe(750);
      expect(delivery.latency).toBe(250);
      expect(delivery.webhookUrl).toBe('https://example.com/webhook');
      expect(delivery.externalDeliveryId).toBe('SM123abc456def');
      expect(delivery.metadata).toEqual(testMetadata);
    });
  });

  describe('validateProvider', () => {
    it('should validate correct provider names', () => {
      expect(TribDeliveryWorkspaceEntity.validateProvider('TWILIO')).toBe(true);
      expect(TribDeliveryWorkspaceEntity.validateProvider('AWS_SNS')).toBe(
        true,
      );
      expect(
        TribDeliveryWorkspaceEntity.validateProvider('AZURE_COMMUNICATION'),
      ).toBe(true);
    });

    it('should reject invalid provider names', () => {
      expect(
        TribDeliveryWorkspaceEntity.validateProvider('INVALID_PROVIDER'),
      ).toBe(false);
      expect(TribDeliveryWorkspaceEntity.validateProvider('twilio')).toBe(
        false,
      );
      expect(TribDeliveryWorkspaceEntity.validateProvider('')).toBe(false);
    });

    it('should handle null and undefined inputs', () => {
      expect(TribDeliveryWorkspaceEntity.validateProvider(null as any)).toBe(
        false,
      );
      expect(
        TribDeliveryWorkspaceEntity.validateProvider(undefined as any),
      ).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(TribDeliveryWorkspaceEntity.validateProvider(123 as any)).toBe(
        false,
      );
      expect(TribDeliveryWorkspaceEntity.validateProvider({} as any)).toBe(
        false,
      );
      expect(TribDeliveryWorkspaceEntity.validateProvider([] as any)).toBe(
        false,
      );
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for terminal statuses', () => {
      const terminalStatuses = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.CANCELED,
        TribDeliveryStatus.UNDELIVERED,
        TribDeliveryStatus.RECEIVED,
      ];

      terminalStatuses.forEach((status) => {
        expect(TribDeliveryWorkspaceEntity.isTerminalStatus(status)).toBe(true);
      });
    });

    it('should return false for non-terminal statuses', () => {
      const nonTerminalStatuses = [
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.ACCEPTED,
        TribDeliveryStatus.RECEIVING,
      ];

      nonTerminalStatuses.forEach((status) => {
        expect(TribDeliveryWorkspaceEntity.isTerminalStatus(status)).toBe(
          false,
        );
      });
    });
  });

  describe('canRetry', () => {
    const MAX_ATTEMPTS = 3;

    it('should allow retry for failed status under max attempts', () => {
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.FAILED,
          1,
          MAX_ATTEMPTS,
        ),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.FAILED,
          2,
          MAX_ATTEMPTS,
        ),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.UNDELIVERED,
          1,
          MAX_ATTEMPTS,
        ),
      ).toBe(true);
    });

    it('should not allow retry for failed status at max attempts', () => {
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.FAILED,
          MAX_ATTEMPTS,
          MAX_ATTEMPTS,
        ),
      ).toBe(false);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.UNDELIVERED,
          MAX_ATTEMPTS,
          MAX_ATTEMPTS,
        ),
      ).toBe(false);
    });

    it('should not allow retry for successful terminal statuses', () => {
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.DELIVERED,
          1,
          MAX_ATTEMPTS,
        ),
      ).toBe(false);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.RECEIVED,
          1,
          MAX_ATTEMPTS,
        ),
      ).toBe(false);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.CANCELED,
          1,
          MAX_ATTEMPTS,
        ),
      ).toBe(false);
    });

    it('should use default max attempts when not specified', () => {
      expect(
        TribDeliveryWorkspaceEntity.canRetry(TribDeliveryStatus.FAILED, 2),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.canRetry(TribDeliveryStatus.FAILED, 3),
      ).toBe(false);
    });

    it('should not allow retry for non-retryable statuses', () => {
      const nonRetryableStatuses = [
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.ACCEPTED,
        TribDeliveryStatus.RECEIVING,
      ];

      nonRetryableStatuses.forEach((status) => {
        expect(
          TribDeliveryWorkspaceEntity.canRetry(status, 1, MAX_ATTEMPTS),
        ).toBe(false);
      });
    });
  });

  describe('isSuccessfulDelivery', () => {
    it('should return true for successful delivery statuses', () => {
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(
          TribDeliveryStatus.DELIVERED,
        ),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(
          TribDeliveryStatus.RECEIVED,
        ),
      ).toBe(true);
    });

    it('should return false for non-successful statuses', () => {
      const nonSuccessfulStatuses = [
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.UNDELIVERED,
        TribDeliveryStatus.CANCELED,
        TribDeliveryStatus.ACCEPTED,
        TribDeliveryStatus.RECEIVING,
      ];

      nonSuccessfulStatuses.forEach((status) => {
        expect(TribDeliveryWorkspaceEntity.isSuccessfulDelivery(status)).toBe(
          false,
        );
      });
    });
  });

  describe('isFailedDelivery', () => {
    it('should return true for failed delivery statuses', () => {
      expect(
        TribDeliveryWorkspaceEntity.isFailedDelivery(TribDeliveryStatus.FAILED),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isFailedDelivery(
          TribDeliveryStatus.UNDELIVERED,
        ),
      ).toBe(true);
    });

    it('should return false for non-failed statuses', () => {
      const nonFailedStatuses = [
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.CANCELED,
        TribDeliveryStatus.ACCEPTED,
        TribDeliveryStatus.RECEIVING,
        TribDeliveryStatus.RECEIVED,
      ];

      nonFailedStatuses.forEach((status) => {
        expect(TribDeliveryWorkspaceEntity.isFailedDelivery(status)).toBe(
          false,
        );
      });
    });
  });

  describe('getValidTransitions', () => {
    it('should return correct transitions for QUEUED status', () => {
      const transitions = TribDeliveryWorkspaceEntity.getValidTransitions(
        TribDeliveryStatus.QUEUED,
      );
      expect(transitions).toContain(TribDeliveryStatus.SENDING);
      expect(transitions).toContain(TribDeliveryStatus.CANCELED);
      expect(transitions).toContain(TribDeliveryStatus.FAILED);
    });

    it('should return correct transitions for SENDING status', () => {
      const transitions = TribDeliveryWorkspaceEntity.getValidTransitions(
        TribDeliveryStatus.SENDING,
      );
      expect(transitions).toContain(TribDeliveryStatus.SENT);
      expect(transitions).toContain(TribDeliveryStatus.ACCEPTED);
      expect(transitions).toContain(TribDeliveryStatus.FAILED);
      expect(transitions).toContain(TribDeliveryStatus.CANCELED);
    });

    it('should return correct transitions for SENT status', () => {
      const transitions = TribDeliveryWorkspaceEntity.getValidTransitions(
        TribDeliveryStatus.SENT,
      );
      expect(transitions).toContain(TribDeliveryStatus.DELIVERED);
      expect(transitions).toContain(TribDeliveryStatus.UNDELIVERED);
      expect(transitions).toContain(TribDeliveryStatus.FAILED);
    });

    it('should return empty array for terminal statuses', () => {
      expect(
        TribDeliveryWorkspaceEntity.getValidTransitions(
          TribDeliveryStatus.DELIVERED,
        ),
      ).toEqual([]);
      expect(
        TribDeliveryWorkspaceEntity.getValidTransitions(
          TribDeliveryStatus.RECEIVED,
        ),
      ).toEqual([]);
      expect(
        TribDeliveryWorkspaceEntity.getValidTransitions(
          TribDeliveryStatus.CANCELED,
        ),
      ).toEqual([]);
    });

    it('should allow retry transitions from failed states', () => {
      const failedTransitions = TribDeliveryWorkspaceEntity.getValidTransitions(
        TribDeliveryStatus.FAILED,
      );
      const undeliveredTransitions =
        TribDeliveryWorkspaceEntity.getValidTransitions(
          TribDeliveryStatus.UNDELIVERED,
        );

      expect(failedTransitions).toContain(TribDeliveryStatus.QUEUED);
      expect(undeliveredTransitions).toContain(TribDeliveryStatus.QUEUED);
    });
  });

  describe('isValidTransition', () => {
    it('should validate correct status transitions', () => {
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.QUEUED,
          TribDeliveryStatus.SENDING,
        ),
      ).toBe(true);

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.SENDING,
          TribDeliveryStatus.SENT,
        ),
      ).toBe(true);

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.SENT,
          TribDeliveryStatus.DELIVERED,
        ),
      ).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.DELIVERED,
          TribDeliveryStatus.SENDING,
        ),
      ).toBe(false);

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.QUEUED,
          TribDeliveryStatus.DELIVERED,
        ),
      ).toBe(false);

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.CANCELED,
          TribDeliveryStatus.SENT,
        ),
      ).toBe(false);
    });

    it('should validate retry transitions', () => {
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.FAILED,
          TribDeliveryStatus.QUEUED,
        ),
      ).toBe(true);

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.UNDELIVERED,
          TribDeliveryStatus.QUEUED,
        ),
      ).toBe(true);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate correct success rate for mixed deliveries', () => {
      const deliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.UNDELIVERED,
      ];

      const successRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(deliveries);
      expect(successRate).toBe(60); // 3 out of 5 successful
    });

    it('should return 100% for all successful deliveries', () => {
      const deliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.RECEIVED,
        TribDeliveryStatus.DELIVERED,
      ];

      const successRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(deliveries);
      expect(successRate).toBe(100);
    });

    it('should return 0% for all failed deliveries', () => {
      const deliveries = [
        TribDeliveryStatus.FAILED,
        TribDeliveryStatus.UNDELIVERED,
        TribDeliveryStatus.CANCELED,
      ];

      const successRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(deliveries);
      expect(successRate).toBe(0);
    });

    it('should return 0% for empty delivery array', () => {
      const successRate = TribDeliveryWorkspaceEntity.calculateSuccessRate([]);
      expect(successRate).toBe(0);
    });

    it('should handle pending statuses correctly', () => {
      const deliveries = [
        TribDeliveryStatus.DELIVERED,
        TribDeliveryStatus.QUEUED,
        TribDeliveryStatus.SENDING,
        TribDeliveryStatus.SENT,
      ];

      const successRate =
        TribDeliveryWorkspaceEntity.calculateSuccessRate(deliveries);
      expect(successRate).toBe(25); // Only 1 out of 4 is successful (DELIVERED)
    });
  });

  describe('validateWebhookUrl', () => {
    it('should validate correct HTTPS webhook URLs', () => {
      const validUrls = [
        'https://example.com/webhook',
        'https://api.example.com/webhook/delivery',
        'https://webhook.example.com:8080/callback',
        'https://sub.domain.example.com/webhooks/trib',
      ];

      validUrls.forEach((url) => {
        expect(TribDeliveryWorkspaceEntity.validateWebhookUrl(url)).toBe(true);
      });
    });

    it('should reject non-HTTPS URLs', () => {
      const invalidUrls = [
        'http://example.com/webhook',
        'ftp://example.com/webhook',
        'ws://example.com/webhook',
        'example.com/webhook',
        'file:///webhook',
      ];

      invalidUrls.forEach((url) => {
        expect(TribDeliveryWorkspaceEntity.validateWebhookUrl(url)).toBe(false);
      });
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'https://',
        'https:///',
        'https://.',
        'https://.com',
        '',
        'invalid-url-format',
      ];

      malformedUrls.forEach((url) => {
        expect(TribDeliveryWorkspaceEntity.validateWebhookUrl(url)).toBe(false);
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(TribDeliveryWorkspaceEntity.validateWebhookUrl(null as any)).toBe(
        false,
      );
      expect(
        TribDeliveryWorkspaceEntity.validateWebhookUrl(undefined as any),
      ).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(TribDeliveryWorkspaceEntity.validateWebhookUrl(123 as any)).toBe(
        false,
      );
      expect(TribDeliveryWorkspaceEntity.validateWebhookUrl({} as any)).toBe(
        false,
      );
      expect(TribDeliveryWorkspaceEntity.validateWebhookUrl([] as any)).toBe(
        false,
      );
    });
  });

  describe('Enum values', () => {
    it('should have correct TribDeliveryStatus enum values', () => {
      expect(TribDeliveryStatus.QUEUED).toBe('QUEUED');
      expect(TribDeliveryStatus.SENDING).toBe('SENDING');
      expect(TribDeliveryStatus.SENT).toBe('SENT');
      expect(TribDeliveryStatus.DELIVERED).toBe('DELIVERED');
      expect(TribDeliveryStatus.FAILED).toBe('FAILED');
      expect(TribDeliveryStatus.UNDELIVERED).toBe('UNDELIVERED');
      expect(TribDeliveryStatus.CANCELED).toBe('CANCELED');
      expect(TribDeliveryStatus.ACCEPTED).toBe('ACCEPTED');
      expect(TribDeliveryStatus.RECEIVING).toBe('RECEIVING');
      expect(TribDeliveryStatus.RECEIVED).toBe('RECEIVED');
    });

    it('should have correct TribCallbackStatus enum values', () => {
      expect(TribCallbackStatus.PENDING).toBe('PENDING');
      expect(TribCallbackStatus.PROCESSING).toBe('PROCESSING');
      expect(TribCallbackStatus.COMPLETED).toBe('COMPLETED');
      expect(TribCallbackStatus.FAILED).toBe('FAILED');
      expect(TribCallbackStatus.RETRYING).toBe('RETRYING');
      expect(TribCallbackStatus.ABANDONED).toBe('ABANDONED');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical outbound SMS delivery flow', () => {
      // Initial state
      delivery.messageId = 'msg-123';
      delivery.status = TribDeliveryStatus.QUEUED;
      delivery.provider = 'TWILIO';
      delivery.attempts = 0;

      // Validate initial state
      expect(
        TribDeliveryWorkspaceEntity.isTerminalStatus(delivery.status),
      ).toBe(false);
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          delivery.status,
          TribDeliveryStatus.SENDING,
        ),
      ).toBe(true);

      // Move to sending
      delivery.status = TribDeliveryStatus.SENDING;
      delivery.attempts = 1;

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.SENDING,
          TribDeliveryStatus.SENT,
        ),
      ).toBe(true);

      // Move to sent
      delivery.status = TribDeliveryStatus.SENT;
      delivery.latency = 150;

      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          TribDeliveryStatus.SENT,
          TribDeliveryStatus.DELIVERED,
        ),
      ).toBe(true);

      // Final delivery
      delivery.status = TribDeliveryStatus.DELIVERED;
      delivery.cost = 750; // 7.5 cents

      expect(
        TribDeliveryWorkspaceEntity.isTerminalStatus(delivery.status),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isSuccessfulDelivery(delivery.status),
      ).toBe(true);
    });

    it('should handle failed delivery with retry scenario', () => {
      delivery.messageId = 'msg-456';
      delivery.status = TribDeliveryStatus.FAILED;
      delivery.attempts = 1;
      delivery.errorCode = '30008';
      delivery.errorMessage = 'Unknown error';

      // Check if retry is allowed
      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          delivery.status,
          delivery.attempts,
        ),
      ).toBe(true);
      expect(
        TribDeliveryWorkspaceEntity.isValidTransition(
          delivery.status,
          TribDeliveryStatus.QUEUED,
        ),
      ).toBe(true);

      // Retry
      delivery.status = TribDeliveryStatus.QUEUED;
      delivery.attempts = 2;

      expect(
        TribDeliveryWorkspaceEntity.canRetry(
          TribDeliveryStatus.FAILED,
          delivery.attempts,
        ),
      ).toBe(true);
    });

    it('should handle webhook callback processing', () => {
      delivery.webhookUrl = 'https://api.example.com/webhooks/delivery';
      delivery.callbackStatus = TribCallbackStatus.PENDING;

      expect(
        TribDeliveryWorkspaceEntity.validateWebhookUrl(delivery.webhookUrl),
      ).toBe(true);

      delivery.callbackStatus = TribCallbackStatus.COMPLETED;
      delivery.metadata = {
        webhookResponse: { status: 200, timestamp: '2023-01-01T00:00:00Z' },
      };

      expect(delivery.callbackStatus).toBe(TribCallbackStatus.COMPLETED);
    });

    it('should handle cost and performance tracking', () => {
      delivery.cost = 750; // 7.5 cents USD
      delivery.latency = 250; // 250ms
      delivery.timestamp = new Date();

      expect(delivery.cost).toBe(750);
      expect(delivery.latency).toBe(250);
      expect(delivery.timestamp).toBeInstanceOf(Date);
    });

    it('should handle provider-specific metadata', () => {
      delivery.provider = 'TWILIO';
      delivery.externalDeliveryId = 'SM123abc456def789';
      delivery.metadata = {
        twilioSid: 'SM123abc456def789',
        accountSid: 'AC123def456abc',
        twilioStatus: 'delivered',
        price: '0.0075',
        priceUnit: 'USD',
      };

      expect(
        TribDeliveryWorkspaceEntity.validateProvider(delivery.provider),
      ).toBe(true);
      expect(delivery.metadata.twilioSid).toBe('SM123abc456def789');
    });
  });
});

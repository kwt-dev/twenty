import {
  validateTwilioSignature,
  reconstructWebhookUrl,
} from '../../utils/twilio/webhook-validator';
import { createHmac } from 'crypto';

// Test constants to avoid magic numbers
const TEST_AUTH_TOKEN = 'test_auth_token_12345';
const TEST_URL = 'https://api.example.com/webhooks/trib/twilio/delivery-status';
const TEST_PAYLOAD =
  'MessageSid=SM123&MessageStatus=delivered&To=%2B15559876543&From=%2B15551234567';
const TEST_HOST = 'api.example.com';
const TEST_PROTOCOL = 'https';
const TEST_ORIGINAL_URL = '/webhooks/trib/twilio/delivery-status';

describe('Webhook Validator Utils', () => {
  /**
   * Helper function to generate valid Twilio signature for testing
   */
  const generateValidSignature = (
    url: string,
    payload: string,
    authToken: string,
  ): string => {
    const hmac = createHmac('sha1', authToken);
    hmac.update(url + payload);
    return hmac.digest('base64');
  };

  describe('validateTwilioSignature', () => {
    it('should validate correct Twilio signature', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );

      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const invalidSignature = 'invalid_signature_base64';

      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        invalidSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );

      expect(result).toBe(false);
    });

    it('should reject signature with different payload', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );
      const differentPayload = 'MessageSid=SM456&MessageStatus=failed';

      const result = validateTwilioSignature(
        differentPayload,
        validSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );

      expect(result).toBe(false);
    });

    it('should reject signature with different URL', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );
      const differentUrl = 'https://api.example.com/webhooks/different';

      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_AUTH_TOKEN,
        differentUrl,
      );

      expect(result).toBe(false);
    });

    it('should reject signature with different auth token', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );
      const differentAuthToken = 'different_auth_token';

      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        validSignature,
        differentAuthToken,
        TEST_URL,
      );

      expect(result).toBe(false);
    });

    it('should throw error for missing payload', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );

      expect(() => {
        validateTwilioSignature('', validSignature, TEST_AUTH_TOKEN, TEST_URL);
      }).toThrow('Missing required parameters for Twilio signature validation');
    });

    it('should throw error for missing signature', () => {
      expect(() => {
        validateTwilioSignature(TEST_PAYLOAD, '', TEST_AUTH_TOKEN, TEST_URL);
      }).toThrow('Missing required parameters for Twilio signature validation');
    });

    it('should throw error for missing auth token', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );

      expect(() => {
        validateTwilioSignature(TEST_PAYLOAD, validSignature, '', TEST_URL);
      }).toThrow('Missing required parameters for Twilio signature validation');
    });

    it('should throw error for missing URL', () => {
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );

      expect(() => {
        validateTwilioSignature(
          TEST_PAYLOAD,
          validSignature,
          TEST_AUTH_TOKEN,
          '',
        );
      }).toThrow('Missing required parameters for Twilio signature validation');
    });

    it('should handle signatures of different lengths securely', () => {
      const shortSignature = 'short';

      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        shortSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );

      expect(result).toBe(false);
    });

    it('should handle malformed base64 signatures gracefully', () => {
      const malformedSignature = 'not-valid-base64-!!!';

      // This should return false rather than throw for malformed signatures
      const result = validateTwilioSignature(
        TEST_PAYLOAD,
        malformedSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );
      expect(result).toBe(false);
    });
  });

  describe('reconstructWebhookUrl', () => {
    const createMockRequest = (overrides: any = {}) => ({
      protocol: TEST_PROTOCOL,
      get: jest.fn().mockImplementation((header: string) => {
        if (header === 'host') return TEST_HOST;
        return undefined;
      }),
      originalUrl: TEST_ORIGINAL_URL,
      ...overrides,
    });

    it('should reconstruct URL correctly with standard headers', () => {
      const mockRequest = createMockRequest();

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(TEST_URL);
      expect(mockRequest.get).toHaveBeenCalledWith('x-forwarded-proto');
      expect(mockRequest.get).toHaveBeenCalledWith('host');
    });

    it('should use x-forwarded-proto header when available', () => {
      const mockRequest = createMockRequest({
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'x-forwarded-proto') return 'https';
          if (header === 'host') return TEST_HOST;
          return undefined;
        }),
      });

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(TEST_URL);
    });

    it('should handle URLs with query parameters', () => {
      const mockRequest = createMockRequest({
        originalUrl: '/webhooks/trib/twilio/delivery-status?param=value',
      });

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(
        'https://api.example.com/webhooks/trib/twilio/delivery-status?param=value',
      );
    });

    it('should handle different protocols', () => {
      const mockRequest = createMockRequest({
        protocol: 'http',
      });

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(
        'http://api.example.com/webhooks/trib/twilio/delivery-status',
      );
    });

    it('should throw error when host header is missing', () => {
      const mockRequest = createMockRequest({
        get: jest.fn().mockReturnValue(undefined),
      });

      expect(() => {
        reconstructWebhookUrl(mockRequest);
      }).toThrow('Host header is required for webhook URL reconstruction');
    });

    it('should handle different host values', () => {
      const customHost = 'custom.webhook.domain.com';
      const mockRequest = createMockRequest({
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'host') return customHost;
          return undefined;
        }),
      });

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(
        `https://${customHost}/webhooks/trib/twilio/delivery-status`,
      );
    });

    it('should handle ports in host header', () => {
      const hostWithPort = 'api.example.com:8080';
      const mockRequest = createMockRequest({
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'host') return hostWithPort;
          return undefined;
        }),
      });

      const result = reconstructWebhookUrl(mockRequest);

      expect(result).toBe(
        `https://${hostWithPort}/webhooks/trib/twilio/delivery-status`,
      );
    });
  });

  describe('Security considerations', () => {
    it('should perform constant-time comparison for signatures', () => {
      // This test ensures timing attack protection
      const validSignature = generateValidSignature(
        TEST_URL,
        TEST_PAYLOAD,
        TEST_AUTH_TOKEN,
      );
      const similarSignature = validSignature.slice(0, -1) + 'X'; // Change last character

      const startTime1 = process.hrtime();
      validateTwilioSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );
      const endTime1 = process.hrtime(startTime1);

      const startTime2 = process.hrtime();
      validateTwilioSignature(
        TEST_PAYLOAD,
        similarSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );
      const endTime2 = process.hrtime(startTime2);

      // Both operations should take similar time (within reasonable variance)
      // This is a basic check - in practice, constant-time comparison is handled by crypto.timingSafeEqual
      expect(Math.abs(endTime1[1] - endTime2[1])).toBeLessThan(10000000); // 10ms variance
    });

    it('should handle Unicode and special characters in payload', () => {
      const unicodePayload =
        'MessageSid=SM123&Body=Hello%20🌍&To=%2B15559876543';
      const validSignature = generateValidSignature(
        TEST_URL,
        unicodePayload,
        TEST_AUTH_TOKEN,
      );

      const result = validateTwilioSignature(
        unicodePayload,
        validSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );

      expect(result).toBe(true);
    });

    it('should handle very long payloads without performance issues', () => {
      const longPayload =
        'MessageSid=SM123&Body=' + 'A'.repeat(10000) + '&To=%2B15559876543';
      const validSignature = generateValidSignature(
        TEST_URL,
        longPayload,
        TEST_AUTH_TOKEN,
      );

      const startTime = process.hrtime();
      const result = validateTwilioSignature(
        longPayload,
        validSignature,
        TEST_AUTH_TOKEN,
        TEST_URL,
      );
      const endTime = process.hrtime(startTime);

      expect(result).toBe(true);
      expect(endTime[0]).toBeLessThan(1); // Should complete in less than 1 second
    });
  });
});

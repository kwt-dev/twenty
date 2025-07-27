import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validates Twilio webhook signatures using HMAC-SHA1 algorithm with timing-safe comparison.
 *
 * @param payload - Raw webhook payload as string
 * @param signature - X-Twilio-Signature header value
 * @param authToken - Twilio Auth Token for HMAC validation
 * @param url - Full webhook URL including query parameters
 * @returns True if signature is valid, false otherwise
 *
 * @throws {Error} If required parameters are missing or invalid
 */
export function validateTwilioSignature(
  payload: string,
  signature: string,
  authToken: string,
  url: string,
): boolean {
  if (!payload || !signature || !authToken || !url) {
    throw new Error(
      'Missing required parameters for Twilio signature validation',
    );
  }

  try {
    // Create HMAC-SHA1 hash of URL + payload using auth token
    const hmac = createHmac('sha1', authToken);
    hmac.update(url + payload);
    const expectedSignature = hmac.digest('base64');

    // Convert signatures to buffers for timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');
    const providedBuffer = Buffer.from(signature, 'base64');

    // Ensure buffers are same length to prevent timing attacks
    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (error) {
    // Log error but don't expose internal details
    throw new Error('Signature validation failed');
  }
}

/**
 * Reconstructs the full webhook URL for signature validation.
 *
 * @param req - Express request object
 * @returns Full URL including protocol, host, path, and query parameters
 */
export function reconstructWebhookUrl(req: {
  protocol: string;
  get: (header: string) => string | undefined;
  originalUrl: string;
}): string {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');

  if (!host) {
    throw new Error('Host header is required for webhook URL reconstruction');
  }

  return `${protocol}://${host}${req.originalUrl}`;
}

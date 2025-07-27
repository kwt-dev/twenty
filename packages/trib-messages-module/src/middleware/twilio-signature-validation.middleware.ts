import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  validateTwilioSignature,
  reconstructWebhookUrl,
} from '../utils/twilio/webhook-validator';

/**
 * Middleware for validating Twilio webhook signatures.
 *
 * Implements HMAC-SHA1 signature validation with timing-safe comparison
 * to prevent timing attacks and ensure webhook authenticity.
 */
@Injectable()
export class TwilioSignatureValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(
    TwilioSignatureValidationMiddleware.name,
  );

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates Twilio webhook signature before allowing request to proceed.
   *
   * @param req - Express request object with raw body
   * @param res - Express response object
   * @param next - Next function to call if validation passes
   *
   * @throws {HttpException} 403 Forbidden if signature is invalid or missing
   */
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const signature = req.headers['x-twilio-signature'] as string;

      if (!signature) {
        this.logger.warn('Webhook request missing X-Twilio-Signature header');
        throw new HttpException(
          'Missing Twilio signature header',
          HttpStatus.FORBIDDEN,
        );
      }

      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

      if (!authToken) {
        this.logger.error('TWILIO_AUTH_TOKEN not configured');
        throw new HttpException(
          'Webhook validation not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Get raw body as string for signature validation
      const rawBody = (req as any).rawBody || req.body;
      const payload =
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

      // Reconstruct full URL for signature validation
      const webhookUrl = reconstructWebhookUrl(req);

      // Validate signature using timing-safe comparison
      const isValid = validateTwilioSignature(
        payload,
        signature,
        authToken,
        webhookUrl,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio webhook signature', {
          url: webhookUrl,
          signatureLength: signature.length,
        });
        throw new HttpException(
          'Invalid webhook signature',
          HttpStatus.FORBIDDEN,
        );
      }

      this.logger.debug('Twilio webhook signature validated successfully');
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error validating Twilio webhook signature', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpException(
        'Webhook validation failed',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

/**
 * Provider Validation Utilities
 *
 * Validates provider capabilities and settings for TRIB messaging system.
 * Supports Twilio and other provider integrations with capability checking.
 */

/**
 * Supported messaging providers
 */
export enum MessageProvider {
  TWILIO = 'TWILIO',
  AWS_SNS = 'AWS_SNS',
  AZURE_COMMUNICATION = 'AZURE_COMMUNICATION',
}

/**
 * Supported messaging capabilities
 */
export enum MessageCapability {
  SMS = 'SMS',
  MMS = 'MMS',
  VOICE = 'VOICE',
}

/**
 * Provider capability matrix - defines which capabilities each provider supports
 */
const PROVIDER_CAPABILITIES: Record<MessageProvider, MessageCapability[]> = {
  [MessageProvider.TWILIO]: [
    MessageCapability.SMS,
    MessageCapability.MMS,
    MessageCapability.VOICE,
  ],
  [MessageProvider.AWS_SNS]: [MessageCapability.SMS],
  [MessageProvider.AZURE_COMMUNICATION]: [
    MessageCapability.SMS,
    MessageCapability.MMS,
  ],
};

/**
 * Validates if a provider supports the specified capabilities
 *
 * @param provider - The messaging provider to check
 * @param capabilities - Array of capabilities to validate
 * @returns true if provider supports all capabilities, false otherwise
 *
 * @example
 * validateProviderCapabilities("TWILIO", ["SMS", "MMS"]) // returns true
 * validateProviderCapabilities("AWS_SNS", ["MMS"]) // returns false
 */
export function validateProviderCapabilities(
  provider: string,
  capabilities: string[],
): boolean {
  // Validate provider exists
  if (!Object.values(MessageProvider).includes(provider as MessageProvider)) {
    return false;
  }

  // Validate capabilities parameter
  if (!capabilities || !Array.isArray(capabilities)) {
    return false;
  }

  // Validate capabilities are supported by provider
  const providerCapabilities =
    PROVIDER_CAPABILITIES[provider as MessageProvider];

  for (const capability of capabilities) {
    if (
      !Object.values(MessageCapability).includes(
        capability as MessageCapability,
      )
    ) {
      return false;
    }

    if (!providerCapabilities.includes(capability as MessageCapability)) {
      return false;
    }
  }

  return true;
}

/**
 * Gets all supported capabilities for a provider
 *
 * @param provider - The messaging provider
 * @returns Array of supported capabilities or empty array for invalid provider
 */
export function getProviderCapabilities(provider: string): string[] {
  if (!Object.values(MessageProvider).includes(provider as MessageProvider)) {
    return [];
  }

  return PROVIDER_CAPABILITIES[provider as MessageProvider];
}

/**
 * Validates if a provider name is valid
 *
 * @param provider - Provider name to validate
 * @returns true if provider is valid, false otherwise
 */
export function isValidProvider(provider: string): provider is MessageProvider {
  return Object.values(MessageProvider).includes(provider as MessageProvider);
}

/**
 * Gets all available providers
 *
 * @returns Array of all supported provider names
 */
export function getAllProviders(): string[] {
  return Object.values(MessageProvider);
}

export { MessageProvider as Provider, MessageCapability as Capability };

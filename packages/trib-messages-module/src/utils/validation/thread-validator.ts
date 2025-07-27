import {
  TribThreadStatus,
  isValidTribThreadStatus,
} from '../../types/thread-enums';

/**
 * Validates thread status string
 * @param status - Status string to validate
 * @returns True if status is a valid TribThreadStatus
 */
export function validateThreadStatus(status: string): boolean {
  return isValidTribThreadStatus(status);
}

/**
 * Validates thread subject/title
 * @param subject - Subject string to validate
 * @returns True if subject is valid
 */
export function validateThreadSubject(subject: string): boolean {
  if (!subject || typeof subject !== 'string') {
    return false;
  }

  const trimmedSubject = subject.trim();

  // Subject must be non-empty and within reasonable length
  return trimmedSubject.length > 0 && trimmedSubject.length <= 200;
}

/**
 * Validates thread participants array
 * @param participants - Participants array to validate
 * @returns True if participants array is valid
 */
export function validateThreadParticipants(participants: string[]): boolean {
  if (!Array.isArray(participants)) {
    return false;
  }

  // Thread must have at least 1 participant and no more than 100
  if (participants.length < 1 || participants.length > 100) {
    return false;
  }

  // All participants must be valid UUIDs or phone numbers
  return participants.every(
    (participant) =>
      typeof participant === 'string' &&
      participant.trim().length > 0 &&
      participant.length <= 50,
  );
}

/**
 * Validates thread tags array
 * @param tags - Tags array to validate
 * @returns True if tags array is valid
 */
export function validateThreadTags(tags: string[]): boolean {
  if (!Array.isArray(tags)) {
    return false;
  }

  // No more than 20 tags
  if (tags.length > 20) {
    return false;
  }

  // All tags must be valid strings
  return tags.every(
    (tag) =>
      typeof tag === 'string' && tag.trim().length > 0 && tag.length <= 30,
  );
}

/**
 * Validates message count
 * @param messageCount - Message count to validate
 * @returns True if message count is valid
 */
export function validateMessageCount(messageCount: number): boolean {
  return (
    typeof messageCount === 'number' &&
    messageCount >= 0 &&
    messageCount <= 1000000 &&
    Number.isInteger(messageCount)
  );
}

/**
 * Validates thread metadata object
 * @param metadata - Metadata object to validate
 * @returns True if metadata is valid
 */
export function validateThreadMetadata(
  metadata: Record<string, any> | null,
): boolean {
  if (metadata === null || metadata === undefined) {
    return true; // null/undefined is valid
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }

  // Check for reasonable size (serialized JSON should be < 10KB)
  try {
    const serialized = JSON.stringify(metadata);
    return serialized.length <= 10240; // 10KB limit
  } catch (error) {
    return false; // Invalid JSON
  }
}

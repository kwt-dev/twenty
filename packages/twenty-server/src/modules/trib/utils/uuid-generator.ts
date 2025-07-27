import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a TRIB-compatible UUID following the 20202020-XXXX pattern
 * @param category - The category identifier (e.g., 'MSG', 'CNT', 'USR')
 * @param index - The index number for the category
 * @returns A formatted UUID string following Twenty conventions
 */
export function generateTribUuid(category: string, index: number): string {
  if (!category || category.length === 0) {
    throw new Error('Category cannot be empty');
  }

  if (index < 0 || index > 9999) {
    throw new Error('Index must be between 0 and 9999');
  }

  const categoryFormatted = category
    .toUpperCase()
    .padEnd(4, '0')
    .substring(0, 4);
  const indexFormatted = index.toString().padStart(4, '0');

  // Generate base UUID and extract the last 16 characters (4 + 12)
  const baseUuid = uuidv4().replace(/-/g, '').toUpperCase();
  const suffix = baseUuid.substring(16); // Take last 16 characters

  // Format: 20202020-XXXX-XXXX-XXXX-XXXXXXXXXXXX
  return `20202020-${categoryFormatted}-${indexFormatted}-${suffix.substring(0, 4)}-${suffix.substring(4)}`;
}

/**
 * Validate if a UUID follows the TRIB pattern
 * @param uuid - The UUID string to validate
 * @returns True if the UUID follows the TRIB pattern
 */
export function isValidTribUuid(uuid: string): boolean {
  const tribPattern =
    /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  return tribPattern.test(uuid);
}

/**
 * Extract category and index from a TRIB UUID
 * @param uuid - The TRIB UUID to parse
 * @returns Object containing category and index, or null if invalid
 */
export function parseTribUuid(
  uuid: string,
): { category: string; index: number } | null {
  if (!isValidTribUuid(uuid)) {
    return null;
  }

  const parts = uuid.split('-');
  const category = parts[1].replace(/0+$/, ''); // Remove trailing zeros
  const index = parseInt(parts[2], 10);

  return { category, index };
}

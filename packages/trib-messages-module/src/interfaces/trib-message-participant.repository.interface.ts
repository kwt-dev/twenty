/**
 * TribMessageParticipant Repository Interface
 *
 * Handles the relationship between TribMessage and Person entities in Twenty CRM,
 * specifically for TRIB SMS phone matching integration.
 * Mirrors the MessageParticipant pattern from the Twenty CRM email system.
 *
 * This interface enables loose coupling between TRIB SMS module and
 * Twenty's ORM implementation while providing complete CRUD operations
 * for SMS message participant management and phone number matching.
 */

/**
 * TribMessageParticipant entity definition
 * Represents the many-to-many relationship between SMS messages and people in Twenty CRM
 * Supports TRIB SMS phone matching workflow for automated contact linking
 */
export interface TribMessageParticipant {
  /** Unique identifier for the participant record */
  id: string;

  /** Foreign key linking to TribMessage in Twenty CRM */
  messageId: string;

  /** Foreign key linking to Person entity in Twenty CRM */
  personId: string;

  /** Role of the person in the SMS message (sender or recipient) */
  role: 'from' | 'to';

  /** Contact handle (phone number for SMS, email for email messages) - primary field for TRIB phone matching */
  handle: string;

  /** Display name for the participant (optional, derived from Twenty CRM Person entity) */
  displayName?: string | null;

  /** Record creation timestamp */
  createdAt: Date;

  /** Record last update timestamp */
  updatedAt: Date;
}

/**
 * Data transfer object for creating new participant records in Twenty CRM TRIB SMS system
 * Omits auto-generated fields (id, createdAt, updatedAt)
 */
export interface CreateTribMessageParticipantData {
  /** Foreign key linking to TribMessage */
  messageId: string;

  /** Foreign key linking to Person entity in Twenty CRM */
  personId: string;

  /** Role of the person in the SMS message */
  role: 'from' | 'to';

  /** Contact handle (phone number for SMS phone matching or email) */
  handle: string;

  /** Optional display name for the participant (from Twenty CRM Person data) */
  displayName?: string;
}

/**
 * Repository interface for TribMessageParticipant operations in Twenty CRM
 * Provides CRUD operations while maintaining loose coupling with Twenty's ORM
 * Supports TRIB SMS phone matching and automated contact linking workflow
 */
export interface ITribMessageParticipantRepository {
  /**
   * Create a new message participant record for Twenty CRM TRIB SMS integration
   * Links a Person to a TribMessage with their role and contact method
   * Used in TRIB SMS phone matching workflow to establish person-message relationships
   *
   * @param data - Participant creation data
   * @returns Created participant record with generated ID and timestamps
   * @throws {Error} If messageId or personId don't exist in Twenty CRM
   * @throws {Error} If duplicate participant would be created
   */
  create(
    data: CreateTribMessageParticipantData,
  ): Promise<TribMessageParticipant>;

  /**
   * Find all participants for a specific SMS message
   * Used to display message participants in Twenty CRM UI
   * Critical for TRIB SMS conversation threading and contact display
   *
   * @param messageId - ID of the message to find participants for
   * @returns Array of participants (may be empty)
   */
  findByMessageId(messageId: string): Promise<TribMessageParticipant[]>;

  /**
   * Find all message participations for a specific person in Twenty CRM
   * Used to display SMS message history in Person views
   * Essential for TRIB SMS conversation history and contact relationship tracking
   *
   * @param personId - ID of the person to find participations for
   * @returns Array of participations (may be empty)
   */
  findByPersonId(personId: string): Promise<TribMessageParticipant[]>;

  /**
   * Find specific participant by message and person
   * Used for checking existing relationships before creating duplicates
   * Critical for preventing duplicate participants in TRIB SMS phone matching
   *
   * @param messageId - ID of the message
   * @param personId - ID of the person
   * @returns Participant record if exists, null otherwise
   */
  findByMessageAndPerson(
    messageId: string,
    personId: string,
  ): Promise<TribMessageParticipant | null>;

  /**
   * Update participant display name or other mutable fields
   * Used when person's display information changes in Twenty CRM
   * Maintains consistency between TRIB SMS participants and Person entities
   *
   * @param id - Participant record ID
   * @param updates - Fields to update (currently only displayName)
   * @returns Updated participant record
   * @throws {Error} If participant doesn't exist
   */
  update(
    id: string,
    updates: Partial<Pick<TribMessageParticipant, 'displayName'>>,
  ): Promise<TribMessageParticipant>;

  /**
   * Delete a participant record
   * Used when unlinking a person from a message (rare operation)
   * May be needed for TRIB SMS phone matching corrections
   *
   * @param id - Participant record ID to delete
   * @returns true if deletion succeeded
   * @throws {Error} If participant doesn't exist
   */
  delete(id: string): Promise<boolean>;

  /**
   * Bulk create participants for a message
   * Used when an SMS message involves multiple people (group messages)
   * Optimizes TRIB SMS phone matching for multi-participant conversations
   *
   * @param participants - Array of participant data to create
   * @returns Array of created participant records
   * @throws {Error} If any creation fails (transaction should rollback)
   */
  createBulk(
    participants: CreateTribMessageParticipantData[],
  ): Promise<TribMessageParticipant[]>;
}

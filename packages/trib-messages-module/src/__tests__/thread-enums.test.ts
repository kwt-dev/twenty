import {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
  isValidTribThreadStatus,
  isValidTribThreadType,
  isValidTribThreadPriority,
  VALID_THREAD_STATUS_TRANSITIONS,
  isValidThreadStatusTransition,
  canReceiveMessages,
  canSendMessages,
  isTerminalThreadStatus,
} from '../types/thread-enums';

describe('Thread Enums', () => {
  describe('TribThreadStatus', () => {
    it('should have correct values', () => {
      expect(TribThreadStatus.ACTIVE).toBe('active');
      expect(TribThreadStatus.ARCHIVED).toBe('archived');
      expect(TribThreadStatus.BLOCKED).toBe('blocked');
      expect(TribThreadStatus.CLOSED).toBe('closed');
      expect(TribThreadStatus.PAUSED).toBe('paused');
    });

    it('should have all expected status values', () => {
      const expectedValues = [
        'active',
        'archived',
        'blocked',
        'closed',
        'paused',
      ];
      const actualValues = Object.values(TribThreadStatus);

      expect(actualValues).toHaveLength(expectedValues.length);
      expectedValues.forEach((value) => {
        expect(actualValues).toContain(value);
      });
    });
  });

  describe('TribThreadType', () => {
    it('should have correct values', () => {
      expect(TribThreadType.INDIVIDUAL).toBe('individual');
      expect(TribThreadType.GROUP).toBe('group');
      expect(TribThreadType.BROADCAST).toBe('broadcast');
      expect(TribThreadType.SUPPORT).toBe('support');
      expect(TribThreadType.MARKETING).toBe('marketing');
    });

    it('should have all expected type values', () => {
      const expectedValues = [
        'individual',
        'group',
        'broadcast',
        'support',
        'marketing',
      ];
      const actualValues = Object.values(TribThreadType);

      expect(actualValues).toHaveLength(expectedValues.length);
      expectedValues.forEach((value) => {
        expect(actualValues).toContain(value);
      });
    });
  });

  describe('TribThreadPriority', () => {
    it('should have correct values', () => {
      expect(TribThreadPriority.LOW).toBe('low');
      expect(TribThreadPriority.NORMAL).toBe('normal');
      expect(TribThreadPriority.HIGH).toBe('high');
      expect(TribThreadPriority.CRITICAL).toBe('critical');
    });

    it('should have all expected priority values', () => {
      const expectedValues = ['low', 'normal', 'high', 'critical'];
      const actualValues = Object.values(TribThreadPriority);

      expect(actualValues).toHaveLength(expectedValues.length);
      expectedValues.forEach((value) => {
        expect(actualValues).toContain(value);
      });
    });
  });

  describe('Type Guard Functions', () => {
    describe('isValidTribThreadStatus', () => {
      it('should return true for valid status values', () => {
        expect(isValidTribThreadStatus('active')).toBe(true);
        expect(isValidTribThreadStatus('archived')).toBe(true);
        expect(isValidTribThreadStatus('blocked')).toBe(true);
        expect(isValidTribThreadStatus('closed')).toBe(true);
        expect(isValidTribThreadStatus('paused')).toBe(true);
      });

      it('should return false for invalid status values', () => {
        expect(isValidTribThreadStatus('invalid')).toBe(false);
        expect(isValidTribThreadStatus('ACTIVE')).toBe(false);
        expect(isValidTribThreadStatus('')).toBe(false);
        expect(isValidTribThreadStatus('pending')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isValidTribThreadStatus(123 as any)).toBe(false);
        expect(isValidTribThreadStatus(null as any)).toBe(false);
        expect(isValidTribThreadStatus(undefined as any)).toBe(false);
        expect(isValidTribThreadStatus([] as any)).toBe(false);
        expect(isValidTribThreadStatus({} as any)).toBe(false);
      });
    });

    describe('isValidTribThreadType', () => {
      it('should return true for valid type values', () => {
        expect(isValidTribThreadType('individual')).toBe(true);
        expect(isValidTribThreadType('group')).toBe(true);
        expect(isValidTribThreadType('broadcast')).toBe(true);
        expect(isValidTribThreadType('support')).toBe(true);
        expect(isValidTribThreadType('marketing')).toBe(true);
      });

      it('should return false for invalid type values', () => {
        expect(isValidTribThreadType('invalid')).toBe(false);
        expect(isValidTribThreadType('INDIVIDUAL')).toBe(false);
        expect(isValidTribThreadType('')).toBe(false);
        expect(isValidTribThreadType('personal')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isValidTribThreadType(123 as any)).toBe(false);
        expect(isValidTribThreadType(null as any)).toBe(false);
        expect(isValidTribThreadType(undefined as any)).toBe(false);
      });
    });

    describe('isValidTribThreadPriority', () => {
      it('should return true for valid priority values', () => {
        expect(isValidTribThreadPriority('low')).toBe(true);
        expect(isValidTribThreadPriority('normal')).toBe(true);
        expect(isValidTribThreadPriority('high')).toBe(true);
        expect(isValidTribThreadPriority('critical')).toBe(true);
      });

      it('should return false for invalid priority values', () => {
        expect(isValidTribThreadPriority('invalid')).toBe(false);
        expect(isValidTribThreadPriority('LOW')).toBe(false);
        expect(isValidTribThreadPriority('')).toBe(false);
        expect(isValidTribThreadPriority('urgent')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isValidTribThreadPriority(123 as any)).toBe(false);
        expect(isValidTribThreadPriority(null as any)).toBe(false);
        expect(isValidTribThreadPriority(undefined as any)).toBe(false);
      });
    });
  });

  describe('Status Transition Validation', () => {
    describe('VALID_THREAD_STATUS_TRANSITIONS', () => {
      it('should have transitions for all status values', () => {
        const allStatuses = Object.values(TribThreadStatus);
        const transitionKeys = Object.keys(VALID_THREAD_STATUS_TRANSITIONS);

        expect(transitionKeys).toHaveLength(allStatuses.length);
        allStatuses.forEach((status) => {
          expect(transitionKeys).toContain(status);
        });
      });

      it('should define valid transitions from ACTIVE', () => {
        const activeTransitions =
          VALID_THREAD_STATUS_TRANSITIONS[TribThreadStatus.ACTIVE];
        expect(activeTransitions).toContain(TribThreadStatus.ARCHIVED);
        expect(activeTransitions).toContain(TribThreadStatus.BLOCKED);
        expect(activeTransitions).toContain(TribThreadStatus.CLOSED);
        expect(activeTransitions).toContain(TribThreadStatus.PAUSED);
        expect(activeTransitions).toHaveLength(4);
      });

      it('should define valid transitions from ARCHIVED', () => {
        const archivedTransitions =
          VALID_THREAD_STATUS_TRANSITIONS[TribThreadStatus.ARCHIVED];
        expect(archivedTransitions).toContain(TribThreadStatus.ACTIVE);
        expect(archivedTransitions).toHaveLength(1);
      });

      it('should define valid transitions from BLOCKED', () => {
        const blockedTransitions =
          VALID_THREAD_STATUS_TRANSITIONS[TribThreadStatus.BLOCKED];
        expect(blockedTransitions).toContain(TribThreadStatus.ACTIVE);
        expect(blockedTransitions).toHaveLength(1);
      });

      it('should define valid transitions from CLOSED', () => {
        const closedTransitions =
          VALID_THREAD_STATUS_TRANSITIONS[TribThreadStatus.CLOSED];
        expect(closedTransitions).toContain(TribThreadStatus.ACTIVE);
        expect(closedTransitions).toHaveLength(1);
      });

      it('should define valid transitions from PAUSED', () => {
        const pausedTransitions =
          VALID_THREAD_STATUS_TRANSITIONS[TribThreadStatus.PAUSED];
        expect(pausedTransitions).toContain(TribThreadStatus.ACTIVE);
        expect(pausedTransitions).toContain(TribThreadStatus.CLOSED);
        expect(pausedTransitions).toHaveLength(2);
      });
    });

    describe('isValidThreadStatusTransition', () => {
      it('should validate valid transitions', () => {
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ACTIVE,
            TribThreadStatus.ARCHIVED,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ACTIVE,
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ACTIVE,
            TribThreadStatus.CLOSED,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ACTIVE,
            TribThreadStatus.PAUSED,
          ),
        ).toBe(true);

        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ARCHIVED,
            TribThreadStatus.ACTIVE,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.BLOCKED,
            TribThreadStatus.ACTIVE,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.CLOSED,
            TribThreadStatus.ACTIVE,
          ),
        ).toBe(true);

        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.PAUSED,
            TribThreadStatus.ACTIVE,
          ),
        ).toBe(true);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.PAUSED,
            TribThreadStatus.CLOSED,
          ),
        ).toBe(true);
      });

      it('should reject invalid transitions', () => {
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ARCHIVED,
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.BLOCKED,
            TribThreadStatus.ARCHIVED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.CLOSED,
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.PAUSED,
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(false);
      });

      it('should reject transitions to same status', () => {
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ACTIVE,
            TribThreadStatus.ACTIVE,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.ARCHIVED,
            TribThreadStatus.ARCHIVED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.BLOCKED,
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.CLOSED,
            TribThreadStatus.CLOSED,
          ),
        ).toBe(false);
        expect(
          isValidThreadStatusTransition(
            TribThreadStatus.PAUSED,
            TribThreadStatus.PAUSED,
          ),
        ).toBe(false);
      });
    });
  });

  describe('Business Logic Functions', () => {
    describe('canReceiveMessages', () => {
      it('should return true only for ACTIVE status', () => {
        expect(canReceiveMessages(TribThreadStatus.ACTIVE)).toBe(true);
        expect(canReceiveMessages(TribThreadStatus.ARCHIVED)).toBe(false);
        expect(canReceiveMessages(TribThreadStatus.BLOCKED)).toBe(false);
        expect(canReceiveMessages(TribThreadStatus.CLOSED)).toBe(false);
        expect(canReceiveMessages(TribThreadStatus.PAUSED)).toBe(false);
      });
    });

    describe('canSendMessages', () => {
      it('should return true for ACTIVE and PAUSED statuses', () => {
        expect(canSendMessages(TribThreadStatus.ACTIVE)).toBe(true);
        expect(canSendMessages(TribThreadStatus.PAUSED)).toBe(true);
        expect(canSendMessages(TribThreadStatus.ARCHIVED)).toBe(false);
        expect(canSendMessages(TribThreadStatus.BLOCKED)).toBe(false);
        expect(canSendMessages(TribThreadStatus.CLOSED)).toBe(false);
      });
    });

    describe('isTerminalThreadStatus', () => {
      it('should return true only for CLOSED status', () => {
        expect(isTerminalThreadStatus(TribThreadStatus.CLOSED)).toBe(true);
        expect(isTerminalThreadStatus(TribThreadStatus.ACTIVE)).toBe(false);
        expect(isTerminalThreadStatus(TribThreadStatus.ARCHIVED)).toBe(false);
        expect(isTerminalThreadStatus(TribThreadStatus.BLOCKED)).toBe(false);
        expect(isTerminalThreadStatus(TribThreadStatus.PAUSED)).toBe(false);
      });
    });
  });

  describe('Enum Completeness', () => {
    it('should have consistent enum value counts', () => {
      // This test helps ensure we don't miss any enum values when adding new ones
      expect(Object.keys(TribThreadStatus)).toHaveLength(5);
      expect(Object.keys(TribThreadType)).toHaveLength(5);
      expect(Object.keys(TribThreadPriority)).toHaveLength(4);
    });

    it('should have consistent transition definitions', () => {
      // Ensure all statuses have transition definitions
      Object.values(TribThreadStatus).forEach((status) => {
        expect(VALID_THREAD_STATUS_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(VALID_THREAD_STATUS_TRANSITIONS[status])).toBe(
          true,
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in type guards', () => {
      expect(isValidTribThreadStatus('')).toBe(false);
      expect(isValidTribThreadType('')).toBe(false);
      expect(isValidTribThreadPriority('')).toBe(false);
    });

    it('should handle whitespace in type guards', () => {
      expect(isValidTribThreadStatus(' active ')).toBe(false);
      expect(isValidTribThreadType(' individual ')).toBe(false);
      expect(isValidTribThreadPriority(' normal ')).toBe(false);
    });

    it('should handle case sensitivity in type guards', () => {
      expect(isValidTribThreadStatus('Active')).toBe(false);
      expect(isValidTribThreadStatus('ACTIVE')).toBe(false);
      expect(isValidTribThreadType('Individual')).toBe(false);
      expect(isValidTribThreadType('INDIVIDUAL')).toBe(false);
      expect(isValidTribThreadPriority('Normal')).toBe(false);
      expect(isValidTribThreadPriority('NORMAL')).toBe(false);
    });

    it('should handle boolean values in type guards', () => {
      expect(isValidTribThreadStatus(true as any)).toBe(false);
      expect(isValidTribThreadStatus(false as any)).toBe(false);
      expect(isValidTribThreadType(true as any)).toBe(false);
      expect(isValidTribThreadType(false as any)).toBe(false);
      expect(isValidTribThreadPriority(true as any)).toBe(false);
      expect(isValidTribThreadPriority(false as any)).toBe(false);
    });
  });
});

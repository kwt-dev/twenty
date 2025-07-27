import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
  isValidTribMessageStatus,
  isValidTribMessageDirection,
  isValidTribMessageChannel,
  isValidTribMessagePriority,
  isValidTribMessageEncoding,
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  isTerminalStatus,
  isRetryableFailure,
} from '../types/message-enums';

describe('Message Enums', () => {
  describe('TribMessageStatus', () => {
    it('should contain all expected status values', () => {
      expect(TribMessageStatus.QUEUED).toBe('queued');
      expect(TribMessageStatus.SENDING).toBe('sending');
      expect(TribMessageStatus.SENT).toBe('sent');
      expect(TribMessageStatus.DELIVERED).toBe('delivered');
      expect(TribMessageStatus.FAILED).toBe('failed');
      expect(TribMessageStatus.UNDELIVERED).toBe('undelivered');
      expect(TribMessageStatus.CANCELED).toBe('canceled');
    });

    it('should have correct number of status values', () => {
      const statusValues = Object.values(TribMessageStatus);
      expect(statusValues).toHaveLength(7);
    });
  });

  describe('TribMessageDirection', () => {
    it('should contain all expected direction values', () => {
      expect(TribMessageDirection.OUTBOUND).toBe('outbound');
      expect(TribMessageDirection.INBOUND).toBe('inbound');
    });

    it('should have correct number of direction values', () => {
      const directionValues = Object.values(TribMessageDirection);
      expect(directionValues).toHaveLength(2);
    });
  });

  describe('TribMessageChannel', () => {
    it('should contain all expected channel values', () => {
      expect(TribMessageChannel.SMS).toBe('sms');
      expect(TribMessageChannel.MMS).toBe('mms');
      expect(TribMessageChannel.WHATSAPP).toBe('whatsapp');
      expect(TribMessageChannel.EMAIL).toBe('email');
      expect(TribMessageChannel.VOICE).toBe('voice');
    });

    it('should have correct number of channel values', () => {
      const channelValues = Object.values(TribMessageChannel);
      expect(channelValues).toHaveLength(5);
    });
  });

  describe('TribMessagePriority', () => {
    it('should contain all expected priority values', () => {
      expect(TribMessagePriority.LOW).toBe('low');
      expect(TribMessagePriority.NORMAL).toBe('normal');
      expect(TribMessagePriority.HIGH).toBe('high');
      expect(TribMessagePriority.CRITICAL).toBe('critical');
    });

    it('should have correct number of priority values', () => {
      const priorityValues = Object.values(TribMessagePriority);
      expect(priorityValues).toHaveLength(4);
    });
  });

  describe('TribMessageEncoding', () => {
    it('should contain all expected encoding values', () => {
      expect(TribMessageEncoding.UTF8).toBe('utf8');
      expect(TribMessageEncoding.ASCII).toBe('ascii');
      expect(TribMessageEncoding.UCS2).toBe('ucs2');
      expect(TribMessageEncoding.LATIN1).toBe('latin1');
    });

    it('should have correct number of encoding values', () => {
      const encodingValues = Object.values(TribMessageEncoding);
      expect(encodingValues).toHaveLength(4);
    });
  });

  describe('Type Guards', () => {
    describe('isValidTribMessageStatus', () => {
      it('should return true for valid status values', () => {
        const validStatuses = Object.values(TribMessageStatus);
        validStatuses.forEach((status) => {
          expect(isValidTribMessageStatus(status)).toBe(true);
        });
      });

      it('should return false for invalid status values', () => {
        const invalidStatuses = [
          'invalid',
          'QUEUED',
          'delivered-failed',
          '',
          'pending',
        ];
        invalidStatuses.forEach((status) => {
          expect(isValidTribMessageStatus(status)).toBe(false);
        });
      });
    });

    describe('isValidTribMessageDirection', () => {
      it('should return true for valid direction values', () => {
        const validDirections = Object.values(TribMessageDirection);
        validDirections.forEach((direction) => {
          expect(isValidTribMessageDirection(direction)).toBe(true);
        });
      });

      it('should return false for invalid direction values', () => {
        const invalidDirections = [
          'invalid',
          'OUTBOUND',
          'both',
          '',
          'incoming',
        ];
        invalidDirections.forEach((direction) => {
          expect(isValidTribMessageDirection(direction)).toBe(false);
        });
      });
    });

    describe('isValidTribMessageChannel', () => {
      it('should return true for valid channel values', () => {
        const validChannels = Object.values(TribMessageChannel);
        validChannels.forEach((channel) => {
          expect(isValidTribMessageChannel(channel)).toBe(true);
        });
      });

      it('should return false for invalid channel values', () => {
        const invalidChannels = ['invalid', 'SMS', 'telegram', '', 'facebook'];
        invalidChannels.forEach((channel) => {
          expect(isValidTribMessageChannel(channel)).toBe(false);
        });
      });
    });

    describe('isValidTribMessagePriority', () => {
      it('should return true for valid priority values', () => {
        const validPriorities = Object.values(TribMessagePriority);
        validPriorities.forEach((priority) => {
          expect(isValidTribMessagePriority(priority)).toBe(true);
        });
      });

      it('should return false for invalid priority values', () => {
        const invalidPriorities = ['invalid', 'LOW', 'urgent', '', 'medium'];
        invalidPriorities.forEach((priority) => {
          expect(isValidTribMessagePriority(priority)).toBe(false);
        });
      });
    });

    describe('isValidTribMessageEncoding', () => {
      it('should return true for valid encoding values', () => {
        const validEncodings = Object.values(TribMessageEncoding);
        validEncodings.forEach((encoding) => {
          expect(isValidTribMessageEncoding(encoding)).toBe(true);
        });
      });

      it('should return false for invalid encoding values', () => {
        const invalidEncodings = [
          'invalid',
          'UTF-8',
          'binary',
          '',
          'iso-8859-1',
        ];
        invalidEncodings.forEach((encoding) => {
          expect(isValidTribMessageEncoding(encoding)).toBe(false);
        });
      });
    });
  });

  describe('Status Transitions', () => {
    describe('VALID_STATUS_TRANSITIONS', () => {
      it('should define correct transitions for QUEUED', () => {
        const queuedTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.QUEUED];
        expect(queuedTransitions).toContain(TribMessageStatus.SENDING);
        expect(queuedTransitions).toContain(TribMessageStatus.CANCELED);
        expect(queuedTransitions).toHaveLength(2);
      });

      it('should define correct transitions for SENDING', () => {
        const sendingTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.SENDING];
        expect(sendingTransitions).toContain(TribMessageStatus.SENT);
        expect(sendingTransitions).toContain(TribMessageStatus.FAILED);
        expect(sendingTransitions).toHaveLength(2);
      });

      it('should define correct transitions for SENT', () => {
        const sentTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.SENT];
        expect(sentTransitions).toContain(TribMessageStatus.DELIVERED);
        expect(sentTransitions).toContain(TribMessageStatus.UNDELIVERED);
        expect(sentTransitions).toHaveLength(2);
      });

      it('should define correct transitions for FAILED', () => {
        const failedTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.FAILED];
        expect(failedTransitions).toContain(TribMessageStatus.QUEUED);
        expect(failedTransitions).toHaveLength(1);
      });

      it('should define correct transitions for UNDELIVERED', () => {
        const undeliveredTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.UNDELIVERED];
        expect(undeliveredTransitions).toContain(TribMessageStatus.QUEUED);
        expect(undeliveredTransitions).toHaveLength(1);
      });

      it('should define no transitions for terminal statuses', () => {
        const deliveredTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.DELIVERED];
        const canceledTransitions =
          VALID_STATUS_TRANSITIONS[TribMessageStatus.CANCELED];

        expect(deliveredTransitions).toHaveLength(0);
        expect(canceledTransitions).toHaveLength(0);
      });
    });

    describe('isValidStatusTransition', () => {
      it('should return true for valid transitions', () => {
        const validTransitions = [
          [TribMessageStatus.QUEUED, TribMessageStatus.SENDING],
          [TribMessageStatus.SENDING, TribMessageStatus.SENT],
          [TribMessageStatus.SENT, TribMessageStatus.DELIVERED],
          [TribMessageStatus.FAILED, TribMessageStatus.QUEUED],
          [TribMessageStatus.UNDELIVERED, TribMessageStatus.QUEUED],
          [TribMessageStatus.QUEUED, TribMessageStatus.CANCELED],
          [TribMessageStatus.SENDING, TribMessageStatus.FAILED],
          [TribMessageStatus.SENT, TribMessageStatus.UNDELIVERED],
        ];

        validTransitions.forEach(([current, next]) => {
          expect(isValidStatusTransition(current, next)).toBe(true);
        });
      });

      it('should return false for invalid transitions', () => {
        const invalidTransitions = [
          [TribMessageStatus.DELIVERED, TribMessageStatus.SENDING],
          [TribMessageStatus.CANCELED, TribMessageStatus.QUEUED],
          [TribMessageStatus.QUEUED, TribMessageStatus.DELIVERED],
          [TribMessageStatus.SENT, TribMessageStatus.QUEUED],
          [TribMessageStatus.DELIVERED, TribMessageStatus.FAILED],
          [TribMessageStatus.CANCELED, TribMessageStatus.SENT],
        ];

        invalidTransitions.forEach(([current, next]) => {
          expect(isValidStatusTransition(current, next)).toBe(false);
        });
      });
    });
  });

  describe('Status Utility Functions', () => {
    describe('isTerminalStatus', () => {
      it('should return true for terminal statuses', () => {
        expect(isTerminalStatus(TribMessageStatus.DELIVERED)).toBe(true);
        expect(isTerminalStatus(TribMessageStatus.CANCELED)).toBe(true);
      });

      it('should return false for non-terminal statuses', () => {
        expect(isTerminalStatus(TribMessageStatus.QUEUED)).toBe(false);
        expect(isTerminalStatus(TribMessageStatus.SENDING)).toBe(false);
        expect(isTerminalStatus(TribMessageStatus.SENT)).toBe(false);
        expect(isTerminalStatus(TribMessageStatus.FAILED)).toBe(false);
        expect(isTerminalStatus(TribMessageStatus.UNDELIVERED)).toBe(false);
      });
    });

    describe('isRetryableFailure', () => {
      it('should return true for retryable failure statuses', () => {
        expect(isRetryableFailure(TribMessageStatus.FAILED)).toBe(true);
        expect(isRetryableFailure(TribMessageStatus.UNDELIVERED)).toBe(true);
      });

      it('should return false for non-retryable statuses', () => {
        expect(isRetryableFailure(TribMessageStatus.QUEUED)).toBe(false);
        expect(isRetryableFailure(TribMessageStatus.SENDING)).toBe(false);
        expect(isRetryableFailure(TribMessageStatus.SENT)).toBe(false);
        expect(isRetryableFailure(TribMessageStatus.DELIVERED)).toBe(false);
        expect(isRetryableFailure(TribMessageStatus.CANCELED)).toBe(false);
      });
    });
  });

  describe('Enum Completeness', () => {
    it('should have all status values covered in transitions', () => {
      const allStatuses = Object.values(TribMessageStatus);
      const transitionKeys = Object.keys(VALID_STATUS_TRANSITIONS);

      allStatuses.forEach((status) => {
        expect(transitionKeys).toContain(status);
      });
    });

    it('should have all enum values as strings', () => {
      const allEnumValues = [
        ...Object.values(TribMessageStatus),
        ...Object.values(TribMessageDirection),
        ...Object.values(TribMessageChannel),
        ...Object.values(TribMessagePriority),
        ...Object.values(TribMessageEncoding),
      ];

      allEnumValues.forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });
});

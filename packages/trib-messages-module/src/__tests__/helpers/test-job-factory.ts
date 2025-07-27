import { Job } from 'bull';

/**
 * Test helper factory for creating mock Bull Job objects
 *
 * This helper addresses the breaking change where processor handlers
 * now receive Job<T> objects instead of raw data T.
 */
export function createMockJob<T>(data: T, id?: string): Job<T> {
  return {
    id: id || Math.random().toString(),
    data,
    opts: {},
    attemptsMade: 0,
    finishedOn: null,
    processedOn: null,
    timestamp: Date.now(),
    name: 'test-job',
    // Required Job properties
    queue: null,
    stacktrace: null,
    returnvalue: null,
    isCompleted: false,
    isActive: false,
    isFailed: false,
    isDelayed: false,
    isWaiting: false,
    isPaused: false,
    isStuck: false,
    // Mock job methods
    progress: jest.fn(),
    log: jest.fn(),
    remove: jest.fn(),
    retry: jest.fn(),
    moveToCompleted: jest.fn(),
    moveToFailed: jest.fn(),
    finished: jest.fn().mockResolvedValue({}),
    // Additional required methods
    discard: jest.fn(),
    promote: jest.fn(),
    update: jest.fn(),
    toJSON: jest.fn(),
    getState: jest.fn(),
    lockKey: jest.fn(),
    releaseLock: jest.fn(),
    takeLock: jest.fn(),
    extendLock: jest.fn(),
  } as unknown as Job<T>;
}

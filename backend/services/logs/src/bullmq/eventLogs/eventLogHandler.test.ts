const mockInsertOne = jest.fn();
const mockHandleAfterProcess = jest.fn().mockResolvedValue(undefined);

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn().mockResolvedValue({
    Logs: { insertOne: mockInsertOne },
  }),
}));

jest.mock('../afterProcess', () => ({
  handleAfterProcess: (...args: unknown[]) => mockHandleAfterProcess(...args),
}));

jest.mock('../mongo', () => ({
  handleMongoChangeEvent: jest.fn(),
}));

import { eventLogHandler } from './eventLogHandler';

describe('eventLogHandler credential boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertOne.mockImplementation(async (document) => document);
  });

  it('persists allowlisted headers while retaining safe custom headers only for after-process hooks', async () => {
    await eventLogHandler('job-1', {
      subdomain: 'os',
      source: 'graphql',
      action: 'mutation',
      status: 'success',
      payload: {
        mutationName: 'usersEdit',
        requestData: {
          authorization: 'Bearer live-session-token',
          cookie: 'auth-token=live-session-token',
          'content-type': 'application/json',
          sessioncode: 'operational-code',
          'x-custom-routing': 'route-a',
        },
        result: {
          loginToken: 'live-session-token',
          tokenUsage: 12,
        },
      },
    });

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          mutationName: 'usersEdit',
          requestData: { 'content-type': 'application/json' },
          result: { tokenUsage: 12 },
        },
      }),
    );
    expect(mockHandleAfterProcess).toHaveBeenCalledWith(
      'os',
      expect.objectContaining({
        payload: expect.objectContaining({
          requestData: {
            'content-type': 'application/json',
            sessioncode: 'operational-code',
            'x-custom-routing': 'route-a',
          },
          result: { tokenUsage: 12 },
        }),
      }),
    );
  });
});

declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>;
      resolve(value: T | PromiseLike<T>): void;
      reject(reason?: unknown): void;
    };
  }
}

interface CoreAccount {
  _id: string;
  role: string;
  isOwner: boolean;
  isActive: boolean;
  appId?: string;
}

interface QueuedNotification {
  _id: string;
  fromUserId?: string;
  sourceText?: string;
}

interface NotificationRunData {
  subdomain: string;
  recipientUserId: string;
  agentId: string;
  notification: QueuedNotification;
}

interface BulkJob {
  name: string;
  data: NotificationRunData;
  opts: {
    jobId: string;
    attempts: number;
    removeOnComplete: { age: number; count: number };
    removeOnFail: { age: number; count: number };
  };
}

const generateModels = jest.fn<Promise<unknown>, unknown[]>();
const prepareTurn = jest.fn<
  Promise<unknown>,
  [input: { message: string } & Record<string, unknown>]
>();
const runAgentTurn = jest.fn<Promise<unknown>, unknown[]>();
const findCoreUsers = jest.fn<
  Promise<CoreAccount[]>,
  [
    subdomain: string,
    query: { _id: { $in: string[] } },
    fields: Record<string, number>,
  ]
>();
const queueAddBulk = jest.fn<Promise<unknown>, [jobs: BulkJob[]]>();
type NotificationJob = { data: unknown };
type NotificationProcessor = (job: NotificationJob) => Promise<unknown>;
type WorkerArgs = [service: string, queue: string, run: NotificationProcessor];

let processor: NotificationProcessor | undefined;

const createMQWorkerWithListeners = jest.fn((...args: WorkerArgs) => {
  processor = args[2];
  return {};
});

jest.mock('erxes-api-shared/utils', () => ({
  createMQWorkerWithListeners: (...args: unknown[]) =>
    createMQWorkerWithListeners(...(args as WorkerArgs)),
  sendWorkerQueue: jest.fn(() => ({ addBulk: queueAddBulk })),
}));
jest.mock('~/connectionResolvers', () => ({
  generateModels: (...args: unknown[]) => generateModels(...args),
}));
jest.mock('@/agent/prepare', () => ({
  prepareTurn: (...args: unknown[]) =>
    prepareTurn(...(args as [{ message: string } & Record<string, unknown>])),
}));
jest.mock('@/agent/run', () => ({
  runAgentTurn: (...args: unknown[]) => runAgentTurn(...args),
}));
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  findCoreUsers: (...args: unknown[]) =>
    findCoreUsers(
      ...(args as [string, { _id: { $in: string[] } }, Record<string, number>]),
    ),
  isAgentAccount: (account: CoreAccount) =>
    account.role === 'user' &&
    account.isOwner !== true &&
    Boolean(account.appId?.startsWith('erxes-agent:')),
  agentIdForAccount: (account: CoreAccount) =>
    account.appId?.replace(/^erxes-agent:/, '') || null,
}));

import { initNotificationTriggers } from '../notificationTriggers';

type MessageHandler = (
  pattern: string,
  channel: string,
  message: string,
) => void;

const makeRedis = () => {
  let messageHandler: MessageHandler | undefined;
  const subscriber = {
    on: jest.fn((event: string, handler: unknown) => {
      if (event === 'pmessage') messageHandler = handler as MessageHandler;
    }),
    psubscribe: jest.fn().mockResolvedValue(1),
  };
  const redis = {
    duplicate: jest.fn(() => subscriber),
    set: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
  };
  return {
    redis,
    subscriber,
    emit: (channel: string, payload: unknown) => {
      messageHandler?.(
        'notificationInserted:*:*',
        channel,
        JSON.stringify(payload),
      );
    },
  };
};

const settleQueueing = async (): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setImmediate(resolve);
  await promise;
};

const queuedJobs = (): BulkJob[] =>
  queueAddBulk.mock.calls.flatMap(([jobs]) => jobs);

const assignmentNotification = {
  _id: 'notification-1',
  userId: 'agent-user-1',
  title: 'Task',
  message: 'You have been assigned to task',
  notificationType: 'taskAssignee',
  action: 'assignee',
  fromUserId: 'human-1',
  contentType: 'operation:task',
  contentTypeId: 'task-1',
  updatedAt: '2026-08-02T00:00:00.000Z',
};

const accounts = new Map<string, CoreAccount>();

beforeEach(() => {
  accounts.clear();
  accounts.set('agent-user-1', {
    _id: 'agent-user-1',
    role: 'user',
    isOwner: false,
    isActive: true,
    appId: 'erxes-agent:agent-profile-1',
  });
  accounts.set('agent-user-2', {
    _id: 'agent-user-2',
    role: 'user',
    isOwner: false,
    isActive: true,
    appId: 'erxes-agent:agent-profile-2',
  });
  for (const userId of ['human-1', 'human-2']) {
    accounts.set(userId, {
      _id: userId,
      role: 'user',
      isOwner: false,
      isActive: true,
    });
  }
  generateModels.mockReset();
  prepareTurn.mockReset();
  runAgentTurn.mockReset();
  findCoreUsers.mockReset().mockImplementation(async (_subdomain, query) =>
    query._id.$in.flatMap((userId) => {
      const account = accounts.get(userId);
      return account ? [account] : [];
    }),
  );
  queueAddBulk.mockReset().mockResolvedValue(undefined);
  createMQWorkerWithListeners.mockClear();
  processor = undefined;
});

describe('cross-system AI team-member triggers', () => {
  it('queues an assignment addressed to an active AI team member', async () => {
    const { redis, subscriber, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:os:agent-user-1', {
      notificationInserted: assignmentNotification,
    });
    await settleQueueing();

    expect(subscriber.psubscribe).toHaveBeenCalledWith(
      'notificationInserted:*:*',
      'activityLogInserted:*:*',
    );
    expect(findCoreUsers).toHaveBeenCalledWith(
      'os',
      { _id: { $in: ['agent-user-1', 'human-1'] } },
      { _id: 1, role: 1, isOwner: 1, isActive: 1, appId: 1 },
    );
    expect(queuedJobs()).toEqual([
      expect.objectContaining({
        name: 'notification-run',
        data: expect.objectContaining({
          subdomain: 'os',
          recipientUserId: 'agent-user-1',
          agentId: 'agent-profile-1',
          notification: expect.objectContaining({
            _id: 'notification-1',
            contentTypeId: 'task-1',
          }),
        }),
        opts: expect.objectContaining({
          jobId: expect.stringMatching(/^[a-f0-9]{64}$/),
          attempts: 9,
          removeOnComplete: { age: 86400, count: 10000 },
          removeOnFail: { age: 604800, count: 10000 },
        }),
      }),
    ]);
  });

  it('queues a mention from another erxes module', async () => {
    const mention = {
      _id: 'notification-2',
      userId: 'agent-user-1',
      title: 'Deal mention',
      message: 'A team member mentioned you in sales:deal',
      action: 'created',
      fromUserId: 'human-2',
      contentType: 'sales:deal',
      contentTypeId: 'deal-1',
      updatedAt: '2026-08-02T00:00:00.000Z',
    };
    const { redis, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:acme:agent-user-1', mention);
    await settleQueueing();

    expect(queuedJobs()[0]?.data).toEqual(
      expect.objectContaining({
        subdomain: 'acme',
        recipientUserId: 'agent-user-1',
        agentId: 'agent-profile-1',
        notification: expect.objectContaining({ _id: 'notification-2' }),
      }),
    );
  });

  it('parses nested core-note mentions once and queues all agents in one batch', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('activityLogInserted:acme:deal-1', {
      activityLogInserted: {
        _id: 'activity-1',
        activityType: 'internalNote',
        targetId: 'deal-1',
        targetType: 'sales:deal',
        actor: { _id: 'human-2' },
        metadata: {
          noteId: 'note-1',
          content: JSON.stringify([
            {
              type: 'bulletListItem',
              children: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'mention',
                      props: {
                        _id: 'agent-user-1',
                        fullName: 'Research agent',
                      },
                    },
                    { type: 'text', text: 'review this deal' },
                    {
                      type: 'mention',
                      props: {
                        _id: 'agent-user-2',
                        fullName: 'Sales agent',
                      },
                    },
                    {
                      type: 'mention',
                      props: {
                        _id: 'agent-user-1',
                        fullName: 'Research agent',
                      },
                    },
                  ],
                },
              ],
            },
          ]),
        },
      },
    });
    await settleQueueing();

    expect(findCoreUsers).toHaveBeenCalledTimes(1);
    expect(queuedJobs()).toHaveLength(2);
    expect(queuedJobs().map(({ data }) => data.recipientUserId)).toEqual([
      'agent-user-1',
      'agent-user-2',
    ]);
    expect(queuedJobs()[0].data.notification).toEqual(
      expect.objectContaining({
        _id: 'internal-note:note-1',
        fromUserId: 'human-2',
        sourceText:
          '@Research agent review this deal @Sales agent @Research agent',
      }),
    );
  });

  it('ignores malformed, oversized, and mention-free activity events', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('activityLogInserted:acme:deal-1', {
      activityLogInserted: {
        _id: 'activity-2',
        activityType: 'internalNote',
        metadata: { content: '{bad json' },
      },
    });
    emit('activityLogInserted:acme:deal-1', {
      activityLogInserted: {
        _id: 'activity-3',
        activityType: 'internalNote',
        metadata: {
          content: JSON.stringify([
            { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
          ]),
        },
      },
    });
    emit('activityLogInserted:acme:deal-1', {
      activityLogInserted: {
        _id: 'activity-4',
        activityType: 'internalNote',
        metadata: { content: 'x'.repeat(100_001) },
      },
    });
    await settleQueueing();

    expect(queueAddBulk).not.toHaveBeenCalled();
    expect(findCoreUsers).not.toHaveBeenCalled();
  });

  it('does not turn a misleading status message into an assignment trigger', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:agent-user-1', {
      ...assignmentNotification,
      _id: 'status-notification',
      action: 'status',
      notificationType: 'taskStatus',
    });
    await settleQueueing();

    expect(findCoreUsers).not.toHaveBeenCalled();
    expect(queueAddBulk).not.toHaveBeenCalled();
  });

  it('ignores unrelated notifications and human recipients', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:human-1', {
      _id: 'notification-3',
      userId: 'human-1',
      title: 'Export complete',
      message: 'Your export is ready',
      action: 'completed',
      contentType: 'core:export',
      contentTypeId: 'export-1',
    });
    emit('notificationInserted:os:human-1', {
      ...assignmentNotification,
      userId: 'human-1',
      fromUserId: 'human-2',
    });
    await settleQueueing();

    expect(findCoreUsers).toHaveBeenCalledTimes(1);
    expect(queueAddBulk).not.toHaveBeenCalled();
  });

  it('ignores inactive recipients and channel-payload mismatches', async () => {
    const account = accounts.get('agent-user-1');
    if (account) account.isActive = false;
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    emit('notificationInserted:os:agent-user-2', assignmentNotification);
    await settleQueueing();

    expect(queueAddBulk).not.toHaveBeenCalled();
  });

  it('blocks starts created by another AI team member', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:agent-user-1', {
      ...assignmentNotification,
      fromUserId: 'agent-user-2',
    });
    await settleQueueing();

    expect(findCoreUsers).toHaveBeenCalledTimes(1);
    expect(queueAddBulk).not.toHaveBeenCalled();
  });

  it('uses one BullMQ id for duplicate delivery of the same event', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    await settleQueueing();

    expect(queueAddBulk).toHaveBeenCalledTimes(2);
    expect(queuedJobs()[0].opts.jobId).toBe(queuedJobs()[1].opts.jobId);
  });

  it('does not suppress a later event that reuses an upserted notification id', async () => {
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    emit('notificationInserted:os:agent-user-1', {
      ...assignmentNotification,
      updatedAt: '2026-08-02T01:00:00.000Z',
    });
    await settleQueueing();

    expect(queuedJobs()[0].opts.jobId).not.toBe(queuedJobs()[1].opts.jobId);
  });

  it('runs the linked profile in a locked record-scoped thread', async () => {
    const agent = { _id: 'agent-profile-1' };
    generateModels.mockResolvedValue({
      MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
    });
    prepareTurn.mockResolvedValue({
      agent: { id: 'runtime-agent' },
      convo: [{ role: 'user', content: 'notification' }],
      authCtx: { principalUserId: 'agent-user-1' },
      memoryBinding: { thread: 'notification-thread' },
    });
    runAgentTurn.mockResolvedValue('Handled');
    const { redis } = makeRedis();
    await initNotificationTriggers(redis as never);

    const result = await processor?.({
      data: {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        agentId: 'agent-profile-1',
        notification: {
          ...assignmentNotification,
          sourceText: '@Agent inspect the latest customer request',
        },
      },
    });

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^erxes-agent:notification-thread:/),
      expect.any(String),
      'PX',
      900000,
      'NX',
    );
    expect(prepareTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        agentId: 'agent-profile-1',
        identity: {
          kind: 'schedule',
          resourceKey: 'notification:agent-profile-1',
        },
        threadId: 'notification:agent-profile-1:operation:task:task-1',
        weaveDigest: false,
      }),
    );
    const prompt = prepareTurn.mock.calls[0][0].message;
    expect(prompt).toContain('"contentTypeId":"task-1"');
    expect(prompt).toContain(
      '"mentionText":"@Agent inspect the latest customer request"',
    );
    expect(runAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        authCtx: expect.objectContaining({
          principalUserId: 'agent-user-1',
        }),
      }),
    );
    expect(redis.eval).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'completed', reply: 'Handled' });
  });

  it('defers a second run while the same record thread is active', async () => {
    const { redis } = makeRedis();
    redis.set.mockResolvedValueOnce(null);
    await initNotificationTriggers(redis as never);

    await expect(
      processor?.({
        data: {
          subdomain: 'os',
          recipientUserId: 'agent-user-1',
          agentId: 'agent-profile-1',
          notification: assignmentNotification,
        },
      }),
    ).rejects.toThrow('Another notification run is active for this record');
    expect(generateModels).not.toHaveBeenCalled();
  });

  it('does not retry an uncertain agent execution failure', async () => {
    generateModels.mockResolvedValue({
      MastraAgent: {
        findOne: jest.fn().mockResolvedValue({ _id: 'agent-profile-1' }),
      },
    });
    prepareTurn.mockResolvedValue({
      agent: { id: 'runtime-agent' },
      convo: [],
      authCtx: {},
      memoryBinding: undefined,
    });
    runAgentTurn.mockRejectedValue(
      new Error('provider failed after tool call'),
    );
    const { redis } = makeRedis();
    await initNotificationTriggers(redis as never);

    const result = await processor?.({
      data: {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        agentId: 'agent-profile-1',
        notification: assignmentNotification,
      },
    });

    expect(runAgentTurn).toHaveBeenCalledTimes(1);
    expect(redis.eval).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'failed',
      reason: 'agent-run-failed',
    });
  });

  it('ignores self-generated notifications before acquiring a lock', async () => {
    const { redis } = makeRedis();
    await initNotificationTriggers(redis as never);

    const result = await processor?.({
      data: {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        agentId: 'agent-profile-1',
        notification: {
          ...assignmentNotification,
          fromUserId: 'agent-user-1',
        },
      },
    });

    expect(result).toEqual({ status: 'ignored', reason: 'self-notification' });
    expect(redis.set).not.toHaveBeenCalled();
    expect(prepareTurn).not.toHaveBeenCalled();
  });
});

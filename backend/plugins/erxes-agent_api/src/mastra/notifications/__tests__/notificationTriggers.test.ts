declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>;
      resolve(value: T | PromiseLike<T>): void;
      reject(reason?: unknown): void;
    };
  }
}

const generateModels = jest.fn<Promise<unknown>, unknown[]>();
const prepareTurn = jest.fn<
  Promise<unknown>,
  [input: { message: string } & Record<string, unknown>]
>();
const runAgentTurn = jest.fn<Promise<unknown>, unknown[]>();
const getAgentAccount = jest.fn<Promise<unknown>, unknown[]>();
const queueAdd = jest.fn<
  Promise<unknown>,
  [name: string, data: unknown, options: { jobId: string }]
>();
type NotificationJob = { data: unknown };
type NotificationProcessor = (job: NotificationJob) => Promise<unknown>;
type WorkerArgs = [
  service: string,
  queue: string,
  run: NotificationProcessor,
];

let processor: NotificationProcessor | undefined;

const createMQWorkerWithListeners = jest.fn(
  (...args: WorkerArgs) => {
    processor = args[2];
    return {};
  },
);

jest.mock('erxes-api-shared/utils', () => ({
  createMQWorkerWithListeners: (...args: unknown[]) =>
    createMQWorkerWithListeners(...(args as WorkerArgs)),
  sendWorkerQueue: jest.fn(() => ({ add: queueAdd })),
}));
jest.mock('~/connectionResolvers', () => ({
  generateModels: (...args: unknown[]) => generateModels(...args),
}));
jest.mock('@/agent/prepare', () => ({
  prepareTurn: (...args: unknown[]) =>
    prepareTurn(
      ...(args as [{ message: string } & Record<string, unknown>]),
    ),
}));
jest.mock('@/agent/run', () => ({
  runAgentTurn: (...args: unknown[]) => runAgentTurn(...args),
}));
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
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
    on: jest.fn((event: string, handler: MessageHandler) => {
      if (event === 'pmessage') messageHandler = handler;
    }),
    psubscribe: jest.fn().mockResolvedValue(1),
  };
  return {
    redis: { duplicate: jest.fn(() => subscriber) },
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

const assignmentNotification = {
  _id: 'notification-1',
  title: 'Task',
  message: 'You have been assigned to task',
  notificationType: 'taskAssignee',
  action: 'assignee',
  fromUserId: 'human-1',
  contentType: 'operation:task',
  contentTypeId: 'task-1',
};

beforeEach(() => {
  generateModels.mockReset();
  prepareTurn.mockReset();
  runAgentTurn.mockReset();
  getAgentAccount.mockReset().mockResolvedValue({
    _id: 'agent-user-1',
    role: 'user',
    isActive: true,
    appId: 'erxes-agent:agent-user-1',
    permissionGroupIds: ['group-1'],
  });
  queueAdd.mockReset().mockResolvedValue(undefined);
  createMQWorkerWithListeners.mockClear();
  processor = undefined;
});

describe('cross-system AI team-member triggers', () => {
  it('queues an assignment addressed to an active AI team-member account', async () => {
    generateModels.mockResolvedValue({
      MastraAgent: { exists: jest.fn().mockResolvedValue(true) },
    });
    const { redis, subscriber, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:os:agent-user-1', {
      notificationInserted: assignmentNotification,
    });
    await settleQueueing();

    expect(subscriber.psubscribe).toHaveBeenCalledWith(
      'notificationInserted:*:*',
    );
    expect(getAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-user-1',
      subdomain: 'os',
    });
    expect(queueAdd).toHaveBeenCalledWith(
      'notification-run',
      {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        notification: assignmentNotification,
      },
      expect.objectContaining({
        jobId: expect.stringMatching(/^[a-f0-9]{64}$/),
        attempts: 3,
      }),
    );
  });

  it('queues mentions from a different erxes module through the same channel', async () => {
    generateModels.mockResolvedValue({
      MastraAgent: { exists: jest.fn().mockResolvedValue(true) },
    });
    const mention = {
      _id: 'notification-2',
      title: 'Deal mention',
      message: 'A team member mentioned you in sales:deal',
      action: 'mentioned',
      fromUserId: 'human-2',
      contentType: 'sales:deal',
      contentTypeId: 'deal-1',
    };
    const { redis, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:acme:agent-user-1', mention);
    await settleQueueing();

    expect(queueAdd).toHaveBeenCalledWith(
      'notification-run',
      expect.objectContaining({
        subdomain: 'acme',
        recipientUserId: 'agent-user-1',
        notification: mention,
      }),
      expect.any(Object),
    );
  });

  it('ignores unrelated notifications and non-agent recipients', async () => {
    const exists = jest.fn().mockResolvedValue(false);
    generateModels.mockResolvedValue({ MastraAgent: { exists } });
    const { redis, emit } = makeRedis();
    await initNotificationTriggers(redis as never);

    emit('notificationInserted:os:human-1', {
      _id: 'notification-3',
      title: 'Export complete',
      message: 'Your export is ready',
      action: 'completed',
    });
    emit('notificationInserted:os:human-1', assignmentNotification);
    await settleQueueing();

    expect(exists).toHaveBeenCalledTimes(1);
    expect(getAgentAccount).not.toHaveBeenCalled();
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it('ignores a profile whose canonical team-member account is inactive', async () => {
    generateModels.mockResolvedValue({
      MastraAgent: { exists: jest.fn().mockResolvedValue(true) },
    });
    getAgentAccount.mockRejectedValue(new Error('inactive'));
    const { redis, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    await settleQueueing();

    expect(queueAdd).not.toHaveBeenCalled();
  });

  it('uses one deterministic BullMQ id for duplicate event delivery', async () => {
    generateModels.mockResolvedValue({
      MastraAgent: { exists: jest.fn().mockResolvedValue(true) },
    });
    const { redis, emit } = makeRedis();

    await initNotificationTriggers(redis as never);
    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    emit('notificationInserted:os:agent-user-1', assignmentNotification);
    await settleQueueing();

    expect(queueAdd).toHaveBeenCalledTimes(2);
    expect(queueAdd.mock.calls[0][2].jobId).toBe(
      queueAdd.mock.calls[1][2].jobId,
    );
  });

  it('runs the canonical account profile in a stable record-scoped thread', async () => {
    const agent = { _id: 'agent-user-1' };
    generateModels.mockResolvedValue({
      MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
    });
    prepareTurn.mockResolvedValue({
      agent: { id: 'runtime-agent' },
      convo: [{ role: 'user', content: 'notification' }],
      authCtx: {
        principalUserId: 'agent-user-1',
        token: 'agent-token',
      },
      memoryBinding: { thread: 'notification-thread' },
    });
    runAgentTurn.mockResolvedValue('Handled');
    const { redis } = makeRedis();
    await initNotificationTriggers(redis as never);

    const result = await processor?.({
      data: {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        notification: assignmentNotification,
      },
    });

    expect(prepareTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        agentId: 'agent-user-1',
        identity: {
          kind: 'schedule',
          resourceKey: 'notification:agent-user-1',
        },
        threadId: 'notification:agent-user-1:operation:task:task-1',
        weaveDigest: true,
      }),
    );
    const prompt = prepareTurn.mock.calls[0][0].message as string;
    expect(prompt).toContain('mention or assignment');
    expect(prompt).toContain('"notificationType":"taskAssignee"');
    expect(runAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        authCtx: expect.objectContaining({
          principalUserId: 'agent-user-1',
          token: 'agent-token',
        }),
      }),
    );
    expect(result).toEqual({ status: 'completed', reply: 'Handled' });
  });

  it('ignores self-generated notifications to prevent trigger loops', async () => {
    const findOne = jest.fn().mockResolvedValue({ _id: 'agent-user-1' });
    generateModels.mockResolvedValue({ MastraAgent: { findOne } });
    const { redis } = makeRedis();
    await initNotificationTriggers(redis as never);

    const result = await processor?.({
      data: {
        subdomain: 'os',
        recipientUserId: 'agent-user-1',
        notification: {
          ...assignmentNotification,
          fromUserId: 'agent-user-1',
        },
      },
    });

    expect(result).toEqual({ status: 'ignored', reason: 'self-notification' });
    expect(prepareTurn).not.toHaveBeenCalled();
  });
});

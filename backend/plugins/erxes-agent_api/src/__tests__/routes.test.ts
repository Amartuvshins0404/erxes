/**
 * Route-level contract tests for the Agents HTTP surface.
 *
 * These drive the real Express router with requests shaped the way the
 * platform gateway actually sends them (base64 `user` header + `hostname`
 * header) and verify the invariants that matter most:
 *
 * - unauthenticated or malformed identities never reach the agent runtime;
 * - a client can never continue or read a thread owned by another user;
 * - only the newest client message is forwarded to the model;
 * - the acting user's identity is stamped from headers, never from the body;
 * - a finished turn (and its later generated title) publishes the per-user
 *   `agentsThreadsChanged` event so the sidebar refreshes without a manual
 *   reload.
 */

import { router } from '~/routes';

jest.mock('erxes-api-shared/utils', () => ({
  // Faithful copies of the platform implementations so the routes are
  // exercised with the gateway's real wire format instead of a stub.
  extractUserFromHeader: (headers: Record<string, unknown>) => {
    const raw = headers.user;
    if (!raw || Array.isArray(raw)) {
      return null;
    }
    return JSON.parse(Buffer.from(String(raw), 'base64').toString('utf-8'));
  },
  getSubdomain: (req: { headers: Record<string, unknown> }) =>
    String(req.headers.hostname ?? '')
      .replace(/(^\w+:|^)\/\//, '')
      .split('.')[0],
}));

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(),
}));
jest.mock('@/agents/agent', () => ({
  buildAgentsAgent: jest.fn(),
  isAgentsThinkingLevel: (value: unknown) =>
    typeof value === 'string' &&
    ['off', 'minimal', 'low', 'medium', 'high'].includes(value),
}));
jest.mock('@/agents/memory', () => ({
  getAgentsMemory: jest.fn(),
  getAgentsRuntime: jest.fn(),
}));
jest.mock('@/agents/threadsEvents', () => ({
  publishAgentsThreadsChanged: jest.fn(),
}));
jest.mock('ai', () => ({
  pipeUIMessageStreamToResponse: jest.fn(),
}));
jest.mock('@mastra/ai-sdk', () => ({
  toAISdkStream: jest.fn(),
}));

import type { Agent } from '@mastra/core/agent' with {
  'resolution-mode': 'import',
};
import { generateModels } from '~/connectionResolvers';
import { buildAgentsAgent } from '@/agents/agent';
import { getAgentsRuntime } from '@/agents/memory';
import { publishAgentsThreadsChanged } from '@/agents/threadsEvents';

// `ai` and `@mastra/ai-sdk` are ESM-only; the mocked modules are retrieved
// through jest.requireMock so this CommonJS test file never imports them.
const { pipeUIMessageStreamToResponse: mockedPipe } = jest.requireMock(
  'ai',
) as { pipeUIMessageStreamToResponse: jest.Mock };
const { toAISdkStream: mockedToAISdkStream } = jest.requireMock(
  '@mastra/ai-sdk',
) as { toAISdkStream: jest.Mock };

const mockedGenerateModels = generateModels as jest.MockedFunction<
  typeof generateModels
>;
const mockedBuildAgentsAgent = buildAgentsAgent as jest.MockedFunction<
  typeof buildAgentsAgent
>;
const mockedGetAgentsRuntime = getAgentsRuntime as jest.MockedFunction<
  typeof getAgentsRuntime
>;
const mockedPublishAgentsThreadsChanged =
  publishAgentsThreadsChanged as jest.MockedFunction<
    typeof publishAgentsThreadsChanged
  >;

interface IRouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle: (req: unknown, res: unknown) => Promise<void> | void }[];
  };
}

const getHandler = (method: string, path: string) => {
  const layers = (router as unknown as { stack: IRouteLayer[] }).stack;
  for (const layer of layers) {
    if (layer.route?.path === path && layer.route.methods[method]) {
      const handle = layer.route.stack[0]?.handle;
      if (handle) {
        return handle;
      }
    }
  }
  throw new Error(`No route registered for ${method.toUpperCase()} ${path}`);
};

const chatHandler = getHandler('post', '/agents/chat');
const approveHandler = getHandler('post', '/agents/approve');
const answerHandler = getHandler('post', '/agents/answer');

interface IFakeResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status(code: number): IFakeResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

const buildRes = (): IFakeResponse => {
  const res: IFakeResponse = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
    },
  };
  return res;
};

interface IReqOptions {
  user?: Record<string, unknown>;
  hostname?: string;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

const buildReq = (options: IReqOptions = {}) => {
  const headers: Record<string, string> = {
    hostname: options.hostname ?? 'tenant.example.com',
  };
  if (options.user) {
    headers.user = Buffer.from(JSON.stringify(options.user), 'utf-8').toString(
      'base64',
    );
  }
  return {
    headers,
    body: options.body ?? {},
    query: options.query ?? {},
    params: options.params ?? {},
  };
};

const ACTING_USER = { _id: 'user-1', email: 'agent@example.com' };
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONNECTION_DOC = {
  userId: 'user-1',
  connections: [
    {
      provider: 'openai',
      model: 'gpt-5.6-luna',
      config: { apiKey: 'sk-test' },
    },
  ],
};

const connectionModel = {
  getConnections: jest.fn(),
  upsertConnection: jest.fn(),
  removeConnection: jest.fn(),
};

const settingsModel = {
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};

const userMessage = (text: string) => ({
  id: `m-${text}`,
  role: 'user',
  content: [{ type: 'text', text }],
});

interface IMemoryFake {
  getThreadById: jest.Mock;
  listThreads: jest.Mock;
  recall: jest.Mock;
  saveMessages: jest.Mock;
}

const threadPage = (
  threads: unknown[],
  extra: Record<string, unknown> = {},
) => ({
  threads,
  total: threads.length,
  page: 0,
  perPage: 20,
  hasMore: false,
  ...extra,
});

const messagePage = (
  messages: unknown[],
  thread: unknown,
  extra: Record<string, unknown> = {},
) => ({
  thread,
  messages,
  total: messages.length,
  page: 0,
  perPage: 20,
  hasMore: false,
  ...extra,
});

const buildMemory = (): IMemoryFake => ({
  getThreadById: jest.fn(async () => null),
  listThreads: jest.fn(async () => threadPage([])),
  recall: jest.fn(async () => messagePage([], null)),
  saveMessages: jest.fn(async ({ messages }) => ({ messages })),
});

interface IStreamOptions {
  memory?: {
    thread: string;
    resource: string;
    onTitleGenerated?: () => void;
  };
  onFinish?: () => void;
  requestContext?: { get(key: string): unknown };
}

const streamMock = jest.fn<
  Promise<{ sentinel: string }>,
  [unknown[], IStreamOptions]
>(async () => ({ sentinel: 'mastra-stream' }));

interface ISuspendedRun {
  runId: string;
  toolCalls?: {
    toolCallId?: string;
    toolName?: string;
    requiresApproval: boolean;
    suspendPayload?: unknown;
  }[];
}

interface IApproveOptions {
  runId?: string;
  toolCallId?: string;
  reason?: string;
  memory?: {
    thread: string;
    resource: string;
    onTitleGenerated?: () => void;
  };
  requestContext?: { get(key: string): unknown };
}

const listSuspendedRunsMock = jest.fn<
  Promise<{ runs: ISuspendedRun[]; total: number }>,
  [{ threadId?: string; resourceId?: string }?]
>(async () => ({ runs: [], total: 0 }));

const approveToolCallMock = jest.fn<
  Promise<{ sentinel: string }>,
  [IApproveOptions]
>(async () => ({ sentinel: 'approved-stream' }));

const declineToolCallMock = jest.fn<
  Promise<{ sentinel: string }>,
  [IApproveOptions]
>(async () => ({ sentinel: 'declined-stream' }));

interface IResumeOptions {
  runId?: string;
  toolCallId?: string;
  maxSteps?: number;
  memory?: {
    thread: string;
    resource: string;
    onTitleGenerated?: () => void;
  };
  requestContext?: { get(key: string): unknown };
}

const resumeStreamMock = jest.fn<
  Promise<{ sentinel: string }>,
  [unknown, IResumeOptions]
>(async () => ({ sentinel: 'resumed-stream' }));

const MASTRA_SENTINEL = { sentinel: 'mastra-instance' };

let memory: IMemoryFake;

beforeEach(() => {
  jest.clearAllMocks();
  memory = buildMemory();
  mockedGenerateModels.mockResolvedValue({
    AgentsConnection: connectionModel,
    AgentsSettings: settingsModel,
  } as unknown as Awaited<ReturnType<typeof generateModels>>);
  connectionModel.getConnections.mockResolvedValue(CONNECTION_DOC);
  settingsModel.getSettings.mockResolvedValue({
    codeModeEnabled: false,
    codeModeEnvironment: 'in-process',
  });
  mockedGetAgentsRuntime.mockResolvedValue({
    memory,
    mastra: MASTRA_SENTINEL,
  } as unknown as Awaited<ReturnType<typeof getAgentsRuntime>>);
  mockedBuildAgentsAgent.mockResolvedValue({
    stream: streamMock,
    listSuspendedRuns: listSuspendedRunsMock,
    approveToolCall: approveToolCallMock,
    declineToolCall: declineToolCallMock,
    resumeStream: resumeStreamMock,
  } as unknown as Agent);
  mockedToAISdkStream.mockImplementation((stream: unknown) => ({
    wrapped: stream,
  }));
});

const body = (res: IFakeResponse) =>
  res.body as { error?: string; threads?: unknown[]; thread?: unknown; messages?: unknown[] };

describe('POST /agents/chat — authentication and validation', () => {
  it('rejects unauthenticated requests before touching the agent runtime', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({ body: { messages: [userMessage('hi')] } }),
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(body(res).error).toBe('Authentication required');
    expect(mockedBuildAgentsAgent).not.toHaveBeenCalled();
    expect(streamMock).not.toHaveBeenCalled();
    expect(mockedPipe).not.toHaveBeenCalled();
  });

  it('rejects a user header that does not carry a user id', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: { email: 'no-id@example.com' },
        body: { messages: [userMessage('hi')] },
      }),
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(mockedBuildAgentsAgent).not.toHaveBeenCalled();
  });

  it('rejects a request without messages', async () => {
    const res = buildRes();
    await chatHandler(buildReq({ user: ACTING_USER, body: { messages: [] } }), res);

    expect(res.statusCode).toBe(400);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('rejects when the newest message is not from the user', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: {
          messages: [
            userMessage('hi'),
            { id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
          ],
        },
      }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe('The newest message must be from the user.');
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('asks for an API key when the acting user has no stored connection', async () => {
    connectionModel.getConnections.mockResolvedValue(null);
    const res = buildRes();
    await chatHandler(
      buildReq({ user: ACTING_USER, body: { messages: [userMessage('hi')] } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe(
      'Add your API key to start using Agents.',
    );
    expect(streamMock).not.toHaveBeenCalled();
  });

  it('maps unexpected runtime failures to a JSON 500 instead of crashing', async () => {
    mockedBuildAgentsAgent.mockRejectedValue(new Error('model exploded'));
    const res = buildRes();
    await chatHandler(
      buildReq({ user: ACTING_USER, body: { messages: [userMessage('hi')] } }),
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(body(res).error).toBe('model exploded');
    expect(mockedPipe).not.toHaveBeenCalled();
  });
});

describe('POST /agents/chat — thread ownership and isolation', () => {
  it('refuses to continue a thread owned by another user', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-other' });
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: { messages: [userMessage('hi')], threadId: 'stolen-thread' },
      }),
      res,
    );

    expect(res.statusCode).toBe(403);
    expect(body(res).error).toBe('Thread belongs to another user.');
    expect(mockedBuildAgentsAgent).not.toHaveBeenCalled();
    expect(streamMock).not.toHaveBeenCalled();
    expect(mockedPipe).not.toHaveBeenCalled();
  });

  it('streams into the client-supplied thread when the acting user owns it', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: { messages: [userMessage('hi')], threadId: 'own-thread' },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers['X-Agents-Thread-Id']).toBe('own-thread');
    expect(mockedBuildAgentsAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        connection: CONNECTION_DOC.connections[0],
        memory,
        mastra: MASTRA_SENTINEL,
      }),
    );
    expect(streamMock).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'm-hi' })],
      expect.objectContaining({
        memory: expect.objectContaining({
          thread: 'own-thread',
          resource: 'user-1',
        }),
      }),
    );
  });

  it('starts a new thread when no threadId is supplied and announces the id before streaming', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({ user: ACTING_USER, body: { messages: [userMessage('hi')] } }),
      res,
    );

    const announced = res.headers['X-Agents-Thread-Id'];
    expect(announced).toMatch(UUID_PATTERN);
    expect(memory.getThreadById).toHaveBeenCalledWith({ threadId: announced });
    expect(streamMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        memory: expect.objectContaining({
          thread: announced,
          resource: 'user-1',
        }),
      }),
    );
  });

  it('treats a blank threadId as a request for a new thread', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: { messages: [userMessage('hi')], threadId: '   ' },
      }),
      res,
    );

    const announced = res.headers['X-Agents-Thread-Id'];
    expect(announced).toMatch(UUID_PATTERN);
    expect(announced).not.toBe('   ');
  });
});

describe('POST /agents/chat — model input and identity', () => {
  it('forwards only the newest client message, never the client transcript', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: {
          messages: [
            userMessage('first'),
            userMessage('second'),
            userMessage('third'),
          ],
        },
      }),
      res,
    );

    expect(streamMock).toHaveBeenCalledTimes(1);
    const forwarded = streamMock.mock.calls[0][0];
    expect(forwarded).toEqual([expect.objectContaining({ id: 'm-third' })]);
  });

  it('stamps the acting identity into the tool request context, ignoring the body', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        hostname: 'tenant.example.com',
        body: { messages: [userMessage('hi')] },
      }),
      res,
    );

    const options = streamMock.mock.calls[0][1];
    expect(options.requestContext?.get('subdomain')).toBe('tenant');
    expect(options.requestContext?.get('userId')).toBe('user-1');
  });

  it('publishes the per-user threads-changed event when the turn finishes and when its title lands', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({ user: ACTING_USER, body: { messages: [userMessage('hi')] } }),
      res,
    );

    expect(res.statusCode).toBe(200);

    // No event fires while the turn is still streaming.
    expect(mockedPublishAgentsThreadsChanged).not.toHaveBeenCalled();

    const options = streamMock.mock.calls[0][1];

    // Mastra fires onFinish after the run's messages are persisted…
    options.onFinish?.();
    expect(mockedPublishAgentsThreadsChanged).toHaveBeenCalledWith('user-1');

    // …and memory.onTitleGenerated later, once the async title is stored.
    options.memory?.onTitleGenerated?.();
    expect(mockedPublishAgentsThreadsChanged).toHaveBeenCalledTimes(2);
  });

  it('pipes the Mastra stream through the AI SDK adapter to the response', async () => {
    const res = buildRes();
    await chatHandler(
      buildReq({ user: ACTING_USER, body: { messages: [userMessage('hi')] } }),
      res,
    );

    expect(mockedToAISdkStream).toHaveBeenCalledWith(
      { sentinel: 'mastra-stream' },
      expect.objectContaining({ version: 'v7' }),
    );
    expect(mockedPipe).toHaveBeenCalledWith(
      expect.objectContaining({
        response: res,
        stream: { wrapped: { sentinel: 'mastra-stream' } },
      }),
    );
  });
});

describe('POST /agents/approve — destructive action approval resume', () => {
  const suspendedRun = (runId: string): ISuspendedRun => ({
    runId,
    toolCalls: [
      {
        toolCallId: 'call-1',
        toolName: 'callTool',
        requiresApproval: true,
        suspendPayload: {
          toolId: 'sales.trpc.deal.remove',
          input: { id: 'deal-1' },
        },
      },
    ],
  });

  it('rejects unauthenticated requests before touching the agent runtime', async () => {
    const res = buildRes();
    await approveHandler(
      buildReq({ body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(body(res).error).toBe('Authentication required');
    expect(mockedBuildAgentsAgent).not.toHaveBeenCalled();
    expect(approveToolCallMock).not.toHaveBeenCalled();
    expect(declineToolCallMock).not.toHaveBeenCalled();
  });

  it('requires a threadId', async () => {
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe('`threadId` is required.');
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('requires an explicit boolean decision', async () => {
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe('`approved` must be true or false.');
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('asks for an API key when the acting user has no stored connection', async () => {
    connectionModel.getConnections.mockResolvedValue(null);
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe(
      'Add your API key to start using Agents.',
    );
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown thread', async () => {
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 'missing', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(404);
    expect(body(res).error).toBe('Thread not found.');
    expect(listSuspendedRunsMock).not.toHaveBeenCalled();
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('refuses to resume a run in a thread owned by another user', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-other' });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(403);
    expect(body(res).error).toBe('Thread belongs to another user.');
    expect(listSuspendedRunsMock).not.toHaveBeenCalled();
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('reports when nothing is awaiting approval on the thread', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(409);
    expect(body(res).error).toBe('No pending approval exists for this thread.');
    expect(approveToolCallMock).not.toHaveBeenCalled();
  });

  it('discovers the suspended run scoped to the thread and the acting user', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [suspendedRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(listSuspendedRunsMock).toHaveBeenCalledWith({
      threadId: 't1',
      resourceId: 'user-1',
    });
    expect(res.statusCode).toBe(200);
  });

  it('approves the newest suspended tool call and streams the continuation', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [suspendedRun('run-newest'), suspendedRun('run-older')],
      total: 2,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(approveToolCallMock).toHaveBeenCalledTimes(1);
    expect(declineToolCallMock).not.toHaveBeenCalled();
    expect(approveToolCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-newest',
        toolCallId: 'call-1',
        memory: expect.objectContaining({
          thread: 't1',
          resource: 'user-1',
        }),
      }),
    );
    const options = approveToolCallMock.mock.calls[0][0];
    expect(options.requestContext?.get('subdomain')).toBe('tenant');
    expect(options.requestContext?.get('userId')).toBe('user-1');
    expect(res.headers['X-Agents-Thread-Id']).toBe('t1');
    expect(mockedToAISdkStream).toHaveBeenCalledWith(
      { sentinel: 'approved-stream' },
      expect.objectContaining({ version: 'v7' }),
    );
    expect(mockedPipe).toHaveBeenCalledWith(
      expect.objectContaining({
        response: res,
        stream: { wrapped: { sentinel: 'approved-stream' } },
      }),
    );
  });

  it('declines the held tool call with the user’s reason instead of executing it', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [suspendedRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', approved: false, reason: 'too risky' },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(approveToolCallMock).not.toHaveBeenCalled();
    expect(declineToolCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        toolCallId: 'call-1',
        reason: 'too risky',
      }),
    );
  });

  it('omits an empty rejection reason', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [suspendedRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', approved: false, reason: '   ' },
      }),
      res,
    );

    const options = declineToolCallMock.mock.calls[0][0];
    expect(options).toEqual(
      expect.objectContaining({ runId: 'run-1', toolCallId: 'call-1' }),
    );
    expect(options).not.toHaveProperty('reason');
  });

  it('omits toolCallId when the suspended run does not report one', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [
        {
          runId: 'run-1',
          toolCalls: [{ toolName: 'callTool', requiresApproval: true }],
        },
      ],
      total: 1,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(200);
    // Without a toolCallId the route defers to Mastra, which approves the
    // run's single pending tool call from its own snapshot.
    const options = approveToolCallMock.mock.calls[0][0];
    expect(options).not.toHaveProperty('toolCallId');
    expect(options).toEqual(expect.objectContaining({ runId: 'run-1' }));
  });

  it('maps unexpected resume failures to a JSON 500 instead of crashing', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [suspendedRun('run-1')],
      total: 1,
    });
    approveToolCallMock.mockRejectedValueOnce(new Error('snapshot lost'));
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(body(res).error).toBe('snapshot lost');
    expect(mockedPipe).not.toHaveBeenCalled();
  });
});

describe('POST /agents/answer — ask_user answer resume', () => {
  // The canonical ask_user suspension: requiresApproval false (the tool
  // called suspend() itself) and a suspendPayload carrying the question.
  const askUserRun = (runId: string): ISuspendedRun => ({
    runId,
    toolCalls: [
      {
        toolCallId: 'call-ask-1',
        toolName: 'askUser',
        requiresApproval: false,
        suspendPayload: {
          question: 'Which deal should I summarize?',
          options: [
            { label: 'Biggest open deal' },
            { label: 'Most recent deal' },
          ],
        },
      },
    ],
  });

  it('rejects unauthenticated requests before touching the agent runtime', async () => {
    const res = buildRes();
    await answerHandler(
      buildReq({ body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(body(res).error).toBe('Authentication required');
    expect(mockedBuildAgentsAgent).not.toHaveBeenCalled();
    expect(resumeStreamMock).not.toHaveBeenCalled();
  });

  it('rejects a missing threadId', async () => {
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe('`threadId` is required.');
    expect(resumeStreamMock).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', undefined],
    ['empty string', '   '],
    ['empty array', []],
    ['array of blanks', ['  ', '']],
    ['array with an empty inner array', [['yes'], []]],
    ['non-string object', { text: 'yes' }],
    ['number', 42],
  ])('rejects an answer that is %s', async (_label, answer) => {
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(body(res).error).toBe(
      '`answer` must be a non-empty string, a non-empty string array, or an array of per-question answers.',
    );
    expect(resumeStreamMock).not.toHaveBeenCalled();
  });

  it('resumes with per-question positional answers untouched', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', answer: ['Sales', ['Won deals', 'Pipeline']] },
      }),
      res,
    );

    expect(resumeStreamMock).toHaveBeenCalledTimes(1);
    const [resumeData, options] = resumeStreamMock.mock.calls[0];
    expect(resumeData).toEqual(['Sales', ['Won deals', 'Pipeline']]);
    expect(options).toEqual(
      expect.objectContaining({
        runId: 'run-1',
        toolCallId: 'call-ask-1',
        maxSteps: 32,
        memory: {
          thread: 't1',
          resource: 'user-1',
          onTitleGenerated: expect.any(Function),
        },
      }),
    );
  });

  it('persists the answer as a user message before resuming', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: {
          threadId: 't1',
          answer: ['Сар сонгосон', ['Долоо хоног 1', 'Долоо хоног 2']],
        },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    // The optimistic UI bubble is client-only, so the backend must store the
    // answer itself — formatted exactly as the UI renders it (' · ' between
    // questions, ', ' inside a multi-select) — or it vanishes on reload.
    expect(memory.saveMessages).toHaveBeenCalledTimes(1);
    const { messages } = memory.saveMessages.mock.calls[0][0];
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: 'user',
      threadId: 't1',
      resourceId: 'user-1',
      content: {
        format: 2,
        parts: [
          {
            type: 'text',
            text: 'Сар сонгосон · Долоо хоног 1, Долоо хоног 2',
          },
        ],
      },
    });
    expect(messages[0].id).toMatch(UUID_PATTERN);
    expect(messages[0].createdAt).toBeInstanceOf(Date);
    // The answer must be stored before the resumed run persists its own
    // messages, so the transcript keeps the user turn before the reply.
    expect(memory.saveMessages.mock.invocationCallOrder[0]).toBeLessThan(
      resumeStreamMock.mock.invocationCallOrder[0],
    );
  });

  it('refuses to resume a run owned by another user', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-other' });
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(403);
    expect(body(res).error).toBe('Thread belongs to another user.');
    expect(resumeStreamMock).not.toHaveBeenCalled();
  });

  it('404s for a missing thread', async () => {
    memory.getThreadById.mockResolvedValue(null);
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 'ghost', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(404);
    expect(body(res).error).toBe('Thread not found.');
  });

  it('409s when no run is suspended for the thread', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({ runs: [], total: 0 });
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(409);
    expect(body(res).error).toBe(
      'No pending interaction exists for this thread.',
    );
    expect(resumeStreamMock).not.toHaveBeenCalled();
  });

  it('409s when the suspension is an approval, not an ask_user question', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [
        {
          runId: 'run-gate',
          toolCalls: [
            {
              toolCallId: 'call-1',
              toolName: 'callTool',
              requiresApproval: true,
            },
          ],
        },
      ],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    // Answering an approval gate would execute the gated tool; it must be
    // decided through /agents/approve instead.
    expect(res.statusCode).toBe(409);
    expect(body(res).error).toBe(
      'This thread is waiting for an approval decision, not an answer.',
    );
    expect(approveToolCallMock).not.toHaveBeenCalled();
    expect(resumeStreamMock).not.toHaveBeenCalled();
    // An approval is not an answer; nothing may be persisted for it.
    expect(memory.saveMessages).not.toHaveBeenCalled();
  });

  it('resumes the newest suspended ask_user run with the answer and streams it', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-2'), askUserRun('run-1')],
      total: 2,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', answer: 'Biggest open deal' },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers['X-Agents-Thread-Id']).toBe('t1');
    // The answer is exactly what the user picked, resumed into the newest
    // run, scoped to that specific tool call, with memory/thread continuity.
    expect(resumeStreamMock).toHaveBeenCalledTimes(1);
    const [resumeData, options] = resumeStreamMock.mock.calls[0];
    expect(resumeData).toBe('Biggest open deal');
    expect(options).toEqual(
      expect.objectContaining({
        runId: 'run-2',
        toolCallId: 'call-ask-1',
        maxSteps: 32,
        memory: {
          thread: 't1',
          resource: 'user-1',
          onTitleGenerated: expect.any(Function),
        },
      }),
    );
    expect(mockedPipe).toHaveBeenCalledWith(
      expect.objectContaining({
        response: res,
        stream: { wrapped: { sentinel: 'resumed-stream' } },
      }),
    );
  });

  it('resumes with a trimmed multi-select answer array', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', answer: [' Deal A  ', 'Deal B' ] },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    const [resumeData] = resumeStreamMock.mock.calls[0];
    expect(resumeData).toEqual(['Deal A', 'Deal B']);
    // The persisted message shows the same trimmed values, formatted exactly
    // as the UI renders the answer bubble (a bare array joins with ' · ').
    const { messages } = memory.saveMessages.mock.calls[0][0];
    expect(messages[0].content.parts[0].text).toBe('Deal A · Deal B');
  });

  it('carries the provider/model/thinking selection onto the resumed run', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-1')],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: {
          threadId: 't1',
          answer: 'yes',
          provider: 'openai',
          model: 'gpt-5.6-luna',
          thinkingLevel: 'high',
        },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    // The agent (and therefore its model config) was rebuilt from the
    // connection the UI selected, not from a server default.
    const agentArg = mockedBuildAgentsAgent.mock.calls[0][0];
    expect(agentArg.connection).toMatchObject({
      provider: 'openai',
      model: 'gpt-5.6-luna',
    });
    expect(agentArg.thinkingLevel).toBe('high');
  });

  it('omits toolCallId when the suspended run does not report one', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [
        {
          runId: 'run-1',
          toolCalls: [{ toolName: 'askUser', requiresApproval: false }],
        },
      ],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(200);
    const options = resumeStreamMock.mock.calls[0][1];
    expect(options).not.toHaveProperty('toolCallId');
    expect(options).toEqual(expect.objectContaining({ runId: 'run-1' }));
  });

  it('maps unexpected resume failures to a JSON 500 instead of crashing', async () => {
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askUserRun('run-1')],
      total: 1,
    });
    resumeStreamMock.mockRejectedValueOnce(new Error('snapshot lost'));
    const res = buildRes();
    await answerHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', answer: 'yes' } }),
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(body(res).error).toBe('snapshot lost');
    expect(mockedPipe).not.toHaveBeenCalled();
  });
});

describe('code mode flag resolved from tenant settings', () => {
  const codeSuspendedRun = (runId: string): ISuspendedRun => ({
    runId,
    toolCalls: [
      {
        toolCallId: 'call-code',
        toolName: 'callTool',
        requiresApproval: true,
        suspendPayload: {
          toolId: 'sales.trpc.deal.remove',
          input: { id: 'deal-1' },
        },
      },
    ],
  });

  const askSuspendedRun = (runId: string): ISuspendedRun => ({
    runId,
    toolCalls: [
      {
        toolCallId: 'call-ask',
        toolName: 'ask_user',
        requiresApproval: false,
        suspendPayload: { question: 'Which one?' },
      },
    ],
  });

  const enableCodeMode = () =>
    settingsModel.getSettings.mockResolvedValue({
      codeModeEnabled: true,
      codeModeEnvironment: 'in-process',
    });

  it('builds the chat agent with the sandboxed code tool when the tenant enables code mode', async () => {
    enableCodeMode();
    const res = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: { messages: [userMessage('compute this in code')] },
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(mockedBuildAgentsAgent).toHaveBeenCalledWith(
      expect.objectContaining({ codeMode: { enabled: true } }),
    );
  });

  it('keeps the code-mode tool on the approve resume path when enabled', async () => {
    enableCodeMode();
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [codeSuspendedRun('run-code')],
      total: 1,
    });
    const res = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      res,
    );

    expect(mockedBuildAgentsAgent).toHaveBeenCalledWith(
      expect.objectContaining({ codeMode: { enabled: true } }),
    );
  });

  it('keeps the code-mode tool on the answer resume path when enabled', async () => {
    enableCodeMode();
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [askSuspendedRun('run-ask')],
      total: 1,
    });
    const res = buildRes();
    await answerHandler(
      buildReq({
        user: ACTING_USER,
        body: { threadId: 't1', answer: 'the first one' },
      }),
      res,
    );

    expect(mockedBuildAgentsAgent).toHaveBeenCalledWith(
      expect.objectContaining({ codeMode: { enabled: true } }),
    );
  });

  it('builds every agent without code mode while the flag is off (default)', async () => {
    // beforeEach already mocks codeModeEnabled: false.
    memory.getThreadById.mockResolvedValue({ resourceId: 'user-1' });
    listSuspendedRunsMock.mockResolvedValue({
      runs: [codeSuspendedRun('run-code')],
      total: 1,
    });

    const chatRes = buildRes();
    await chatHandler(
      buildReq({
        user: ACTING_USER,
        body: { messages: [userMessage('hello')] },
      }),
      chatRes,
    );

    const approveRes = buildRes();
    await approveHandler(
      buildReq({ user: ACTING_USER, body: { threadId: 't1', approved: true } }),
      approveRes,
    );

    expect(mockedBuildAgentsAgent).toHaveBeenCalledTimes(2);
    expect(mockedBuildAgentsAgent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ codeMode: { enabled: false } }),
    );
    expect(mockedBuildAgentsAgent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ codeMode: { enabled: false } }),
    );
  });
});

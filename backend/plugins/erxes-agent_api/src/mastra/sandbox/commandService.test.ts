const createSandbox = jest.fn();
const connectSandbox = jest.fn();

jest.mock('@alibaba-group/opensandbox', () => ({
  ConnectionConfig: jest.fn().mockImplementation((options: unknown) => options),
  Sandbox: {
    create: (...args: unknown[]) => createSandbox(...args),
    connect: (...args: unknown[]) => connectSandbox(...args),
  },
}));

import type { IModels } from '~/connectionResolvers';
import {
  captureSandboxWebsite,
  runSandboxCommand,
  TERMINAL_COMMAND_MAX_BYTES,
  writeSandboxWorkspaceFiles,
} from './commandService';

interface TestHandlers {
  onStdout: (message: { text: string; timestamp: number }) => Promise<void>;
  onStderr: (message: { text: string; timestamp: number }) => Promise<void>;
}

const session: Record<string, unknown> = {
  _id: 'session-1',
  agentId: 'agent-1',
  threadId: 'thread-1',
};

const updateSession = (update: Record<string, Record<string, unknown>>) => {
  Object.assign(session, update.$setOnInsert ?? {}, update.$set ?? {});
  for (const key of Object.keys(update.$unset ?? {})) delete session[key];
};

const sessionModel = {
  findOneAndUpdate: jest.fn(
    async (
      _filter: unknown,
      update: Record<string, Record<string, unknown>>,
    ) => {
      updateSession(update);
      return session;
    },
  ),
  updateOne: jest.fn(
    async (
      _filter: unknown,
      update: Record<string, Record<string, unknown>>,
    ) => {
      updateSession(update);
      return { modifiedCount: 1 };
    },
  ),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
};

const getSettings = jest.fn();
const models = {
  MastraSandboxSession: sessionModel,
  MastraSettings: {
    getSettings,
  },
} as unknown as IModels;

const commandRun = jest.fn();
const getFileInfo = jest.fn();
const readBytes = jest.fn();
const listDirectory = jest.fn();
const createDirectories = jest.fn();
const writeFiles = jest.fn();
const sandbox = {
  id: 'sandbox-1',
  commands: { run: commandRun },
  files: {
    createDirectories,
    writeFiles,
    getFileInfo,
    listDirectory,
    readBytes,
  },
  renew: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  kill: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  createSandbox.mockReset().mockResolvedValue(sandbox);
  connectSandbox.mockReset().mockResolvedValue(sandbox);
  getSettings.mockReset().mockResolvedValue({
    openSandboxApiUrl: 'https://sandbox.example.com',
    openSandboxApiKey: 'sandbox-key',
  });
  commandRun.mockReset();
  getFileInfo.mockReset();
  readBytes.mockReset();
  listDirectory.mockReset();
  createDirectories.mockReset().mockResolvedValue(undefined);
  writeFiles.mockReset().mockResolvedValue(undefined);
  sandbox.renew.mockClear();
  sandbox.close.mockClear();
  sandbox.kill.mockClear();
  sessionModel.findOneAndUpdate.mockClear();
  sessionModel.updateOne.mockClear();
  sessionModel.deleteOne.mockClear();
  delete session.sandboxId;
  delete session.expiresAt;
  delete session.leaseId;
  delete session.leaseExpiresAt;
});

describe('OpenSandbox terminal execution', () => {
  it('creates a deny-network sandbox and runs as an unprivileged workspace user', async () => {
    commandRun
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockImplementationOnce(
        async (_command: string, _options: unknown, handlers: TestHandlers) => {
          await handlers.onStdout({ text: 'hello\n', timestamp: 1 });
          return { exitCode: 0, complete: { executionTimeMs: 25 } };
        },
      );

    const result = await runSandboxCommand(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      { command: 'printf hello', timeoutSeconds: 20 },
    );

    expect(createSandbox).toHaveBeenCalledWith(
      expect.objectContaining({
        secureAccess: false,
        timeoutSeconds: 3600,
      }),
    );
    expect(createSandbox.mock.calls[0][0]).not.toHaveProperty('networkPolicy');
    expect(commandRun).toHaveBeenNthCalledWith(
      3,
      'printf hello',
      expect.objectContaining({
        workingDirectory: '/workspace',
        timeoutSeconds: 20,
        uid: 65534,
        gid: 65534,
        envs: { HOME: '/workspace', TMPDIR: '/workspace/.tmp' },
      }),
      expect.objectContaining({ skipAccumulation: true }),
    );
    expect(result).toEqual({
      cwd: '/workspace',
      exitCode: 0,
      stdout: 'hello\n',
      stderr: '',
      durationMs: 25,
      truncated: false,
      workspaceReused: false,
    });
    expect(sandbox.close).toHaveBeenCalled();
  });

  it('accepts short operational commands up to the 8 KiB boundary', async () => {
    const command = 'x'.repeat(TERMINAL_COMMAND_MAX_BYTES);
    commandRun
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockResolvedValueOnce({ exitCode: 0 });

    await runSandboxCommand(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      { command },
    );

    expect(commandRun).toHaveBeenNthCalledWith(
      3,
      command,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('rejects a command beyond the 8 KiB sandbox boundary', async () => {
    await expect(
      runSandboxCommand(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { command: 'x'.repeat(TERMINAL_COMMAND_MAX_BYTES + 1) },
      ),
    ).rejects.toThrow('Terminal commands are limited to 8KB');
    expect(createSandbox).not.toHaveBeenCalled();
    expect(connectSandbox).not.toHaveBeenCalled();
  });

  it('validates OpenSandbox configuration before allocating a session row', async () => {
    getSettings.mockResolvedValueOnce({});

    await expect(
      runSandboxCommand(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { command: 'printf hello' },
      ),
    ).rejects.toThrow('OpenSandbox is not configured');

    expect(sessionModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects a sandbox when its server-side network isolation is absent', async () => {
    commandRun
      .mockResolvedValueOnce({ exitCode: 0 })
      .mockResolvedValueOnce({ exitCode: 1 });

    await expect(
      runSandboxCommand(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { command: 'printf hello' },
      ),
    ).rejects.toThrow('network isolation check failed');
    expect(sandbox.kill).toHaveBeenCalled();
    expect(sessionModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      }),
      expect.any(Object),
    );
    expect(sessionModel.deleteOne).toHaveBeenCalledWith({
      _id: 'session-1',
      leaseId: expect.any(String),
      sandboxId: { $exists: false },
    });
  });

  it('reconnects to the same sandbox for a later command in the thread', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    commandRun.mockImplementationOnce(
      async (_command: string, _options: unknown, handlers: TestHandlers) => {
        await handlers.onStderr({ text: 'warning\n', timestamp: 1 });
        return { exitCode: 2 };
      },
    );

    const result = await runSandboxCommand(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      { command: 'false' },
    );

    expect(connectSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ sandboxId: 'sandbox-1' }),
    );
    expect(createSandbox).not.toHaveBeenCalled();
    expect(sandbox.renew).toHaveBeenCalledWith(3600);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe('warning\n');
    expect(result.workspaceReused).toBe(true);
  });

  it('returns selected regular workspace files for artifact persistence', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    commandRun.mockResolvedValueOnce({ exitCode: 0 });
    getFileInfo.mockResolvedValue({
      '/workspace/project/dist/report.md': {
        path: '/workspace/project/dist/report.md',
        type: 'file',
        size: 8,
      },
    });
    readBytes.mockResolvedValue(new Uint8Array(Buffer.from('# Report')));

    const result = await runSandboxCommand(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      {
        command: 'build-report',
        cwd: 'project',
        previewPaths: ['dist/report.md'],
      },
    );

    expect(getFileInfo).toHaveBeenCalledWith([
      '/workspace/project/dist/report.md',
    ]);
    expect(readBytes).toHaveBeenCalledWith(
      '/workspace/project/dist/report.md',
      { limit: 20 * 1024 * 1024 + 1 },
    );
    expect(result.previewFiles).toEqual([
      {
        path: 'project/dist/report.md',
        fileName: 'report.md',
        buffer: Buffer.from('# Report'),
      },
    ]);
  });

  it('writes nested source files through the structured workspace API', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await writeSandboxWorkspaceFiles(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      {
        cwd: 'project',
        files: [
          { path: 'src/index.js', content: 'console.log("ready")' },
          { path: 'index.html', content: '<h1>Ready</h1>' },
        ],
      },
    );

    expect(createDirectories).toHaveBeenCalledWith([
      {
        path: '/workspace/project',
        mode: 755,
      },
      {
        path: '/workspace/project/src',
        mode: 755,
      },
    ]);
    expect(writeFiles).toHaveBeenCalledWith([
      expect.objectContaining({
        path: '/workspace/project/src/index.js',
        data: 'console.log("ready")',
        mode: 644,
      }),
      expect.objectContaining({
        path: '/workspace/project/index.html',
        data: '<h1>Ready</h1>',
        mode: 644,
      }),
    ]);
    expect(result).toEqual({
      cwd: '/workspace/project',
      workspaceReused: true,
      files: [
        { path: 'src/index.js', size: 20 },
        { path: 'index.html', size: 14 },
      ],
    });
  });

  it('captures a validated website directory as one nested artifact', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    getFileInfo.mockResolvedValue({
      '/workspace/project/dist': {
        path: '/workspace/project/dist',
        type: 'directory',
      },
    });
    listDirectory.mockResolvedValue([
      { path: 'index.html', type: 'file', size: 13 },
      { path: 'assets/app.js', type: 'file', size: 19 },
    ]);
    readBytes
      .mockResolvedValueOnce(new Uint8Array(Buffer.from('<h1>Site</h1>')))
      .mockResolvedValueOnce(
        new Uint8Array(Buffer.from('console.log("site")')),
      );

    const result = await captureSandboxWebsite(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      {
        cwd: 'project',
        root: 'dist',
        entry: 'index.html',
        title: 'Site',
      },
    );

    expect(listDirectory).toHaveBeenCalledWith({
      path: '/workspace/project/dist',
      depth: 32,
    });
    expect(result).toEqual({
      cwd: '/workspace/project',
      workspaceReused: true,
      website: {
        root: 'project/dist',
        entryPath: 'index.html',
        title: 'Site',
        files: [
          {
            path: 'index.html',
            fileName: 'index.html',
            buffer: Buffer.from('<h1>Site</h1>'),
          },
          {
            path: 'assets/app.js',
            fileName: 'app.js',
            buffer: Buffer.from('console.log("site")'),
          },
        ],
      },
    });
  });

  it('publishes the workspace root when cwd and root use defaults', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    getFileInfo.mockResolvedValue({
      '/workspace': { path: '/workspace', type: 'directory' },
    });
    listDirectory.mockResolvedValue([
      { path: 'index.html', type: 'file', size: 13 },
    ]);
    readBytes.mockResolvedValue(new Uint8Array(Buffer.from('<h1>Site</h1>')));

    const result = await captureSandboxWebsite(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      { root: '.', entry: 'index.html' },
    );

    expect(result.website.root).toBe('.');
    expect(result.website.files).toHaveLength(1);
  });

  it('rejects a website root that is not a directory', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    getFileInfo.mockResolvedValue({
      '/workspace/project/dist': {
        path: '/workspace/project/dist',
        type: 'file',
      },
    });

    await expect(
      captureSandboxWebsite(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { cwd: 'project', root: 'dist', entry: 'index.html' },
      ),
    ).rejects.toThrow('was not found or is not a directory');
    expect(listDirectory).not.toHaveBeenCalled();
    expect(readBytes).not.toHaveBeenCalled();
  });

  it('rejects website files that escape the published directory', async () => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    getFileInfo.mockResolvedValue({
      '/workspace/project/dist': {
        path: '/workspace/project/dist',
        type: 'directory',
      },
    });
    listDirectory.mockResolvedValue([
      { path: '/workspace/project/secret.txt', type: 'file', size: 6 },
    ]);

    await expect(
      captureSandboxWebsite(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { cwd: 'project', root: 'dist', entry: 'index.html' },
      ),
    ).rejects.toThrow('must stay inside the published root');
    expect(readBytes).not.toHaveBeenCalled();
  });

  it.each([
    { website: { root: '../dist' }, label: 'root' },
    {
      website: { root: 'dist', entry: '../index.html' },
      label: 'entry',
    },
  ])('rejects website $label traversal', async ({ website }) => {
    Object.assign(session, {
      sandboxId: 'sandbox-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      captureSandboxWebsite(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { cwd: 'project', ...website },
      ),
    ).rejects.toThrow('must stay in its working directory');
    expect(getFileInfo).not.toHaveBeenCalled();
    expect(listDirectory).not.toHaveBeenCalled();
  });

  it('rejects working-directory traversal before allocating a sandbox', async () => {
    await expect(
      runSandboxCommand(
        models,
        { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
        { command: 'pwd', cwd: '../host' },
      ),
    ).rejects.toThrow('must stay in /workspace');
    expect(createSandbox).not.toHaveBeenCalled();
    expect(connectSandbox).not.toHaveBeenCalled();
  });
  it('serializes operations that target the same thread workspace', async () => {
    commandRun.mockResolvedValue({ exitCode: 0 });
    let releaseFirstWrite: (() => void) | undefined;
    writeFiles
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstWrite = resolve;
          }),
      )
      .mockResolvedValueOnce(undefined);
    const identity = {
      agentId: 'agent-1',
      threadId: 'thread-1',
      subdomain: 'tenant',
    };

    const first = writeSandboxWorkspaceFiles(models, identity, {
      files: [{ path: 'first.txt', content: 'first' }],
    });
    await new Promise((resolve) => setImmediate(resolve));
    const second = writeSandboxWorkspaceFiles(models, identity, {
      files: [{ path: 'second.txt', content: 'second' }],
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(writeFiles).toHaveBeenCalledTimes(1);
    releaseFirstWrite?.();
    await Promise.all([first, second]);
    expect(writeFiles).toHaveBeenCalledTimes(2);
  });
});

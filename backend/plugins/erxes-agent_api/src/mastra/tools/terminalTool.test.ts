const mockRunSandboxCommand = jest.fn();
const mockPersistGeneratedFile = jest.fn();
const mockGetCurrentAuth = jest.fn();
const mockWriteAgentAction = jest.fn();
const mockStoreArtifacts = jest.fn();
const mockFileTypeFromBuffer = jest.fn();

jest.mock('@mastra/core/tools', () => ({
  createTool: (config: unknown) => config,
}));
jest.mock('file-type', () => ({
  fileTypeFromBuffer: (...args: unknown[]) => mockFileTypeFromBuffer(...args),
}));
jest.mock('~/mastra/sandbox/commandService', () => ({
  runSandboxCommand: (...args: unknown[]) => mockRunSandboxCommand(...args),
  TERMINAL_COMMAND_MAX_BYTES: 8 * 1024,
}));
jest.mock('~/mastra/files/persist', () => ({
  persistGeneratedFile: (...args: unknown[]) =>
    mockPersistGeneratedFile(...args),
}));
jest.mock('~/mastra/artifactStore', () => ({
  storeArtifacts: (...args: unknown[]) => mockStoreArtifacts(...args),
}));
jest.mock('~/mastra/requestContext', () => ({
  getCurrentAuth: (...args: unknown[]) => mockGetCurrentAuth(...args),
}));
jest.mock('~/mastra/auditLog', () => ({
  writeAgentAction: (...args: unknown[]) => mockWriteAgentAction(...args),
}));
jest.mock('./artifacts', () => {
  const actual = jest.requireActual('./artifacts');
  return {
    ...actual,
    newArtifactId: () => 'doc_terminal',
  };
});

import type { IModels } from '~/connectionResolvers';
import { createTerminalTool } from './terminalTool';

interface TerminalToolResult {
  cwd: string;
  artifacts: Array<{
    id: string;
    kind: string;
    format?: string;
    title: string;
    fileName: string;
    mimeType: string;
    fileKey: string;
    entryPath?: string;
    fileCount?: number;
    previewToken?: string;
  }>;
  previewFiles?: unknown;
}

const asTool = (tool: unknown) =>
  tool as {
    execute: (input: Record<string, unknown>) => Promise<TerminalToolResult>;
  };

const asConfiguredTool = (tool: unknown) =>
  tool as {
    inputSchema: {
      safeParse: (input: unknown) => { success: boolean };
    };
  };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentAuth.mockReturnValue({
    subdomain: 'tenant',
    agentId: 'agent-1',
    threadId: 'thread-1',
  });
  mockRunSandboxCommand.mockResolvedValue({
    cwd: '/workspace',
    exitCode: 0,
    stdout: 'created report.pdf\n',
    stderr: '',
    durationMs: 12,
    truncated: false,
    workspaceReused: true,
    previewFiles: [
      {
        path: 'dist/report.pdf',
        fileName: 'report.pdf',
        buffer: Buffer.from('%PDF-1.7'),
      },
    ],
  });
  mockFileTypeFromBuffer.mockResolvedValue({
    ext: 'pdf',
    mime: 'application/pdf',
  });
  mockPersistGeneratedFile.mockResolvedValue({
    fileKey: 'private/agent/report.pdf',
    size: 8,
    inline: false,
  });
  mockStoreArtifacts.mockResolvedValue(undefined);
  mockWriteAgentAction.mockResolvedValue(undefined);
});

describe('terminal tool', () => {
  it('accepts short commands and rejects embedded source payloads', () => {
    const models = {} as IModels;
    const tool = asConfiguredTool(
      createTerminalTool({ models, agentId: 'agent-1' }),
    );

    expect(
      tool.inputSchema.safeParse({ command: 'x'.repeat(8 * 1024) }).success,
    ).toBe(true);
    expect(
      tool.inputSchema.safeParse({ command: 'x'.repeat(8 * 1024 + 1) }).success,
    ).toBe(false);
  });

  it('persists selected sandbox files and returns document artifacts', async () => {
    const models = {} as IModels;
    const tool = asTool(createTerminalTool({ models, agentId: 'agent-1' }));

    const result = await tool.execute({
      command: 'build-report',
      timeoutSeconds: 30,
      previewPaths: ['dist/report.pdf'],
    });

    expect(mockPersistGeneratedFile).toHaveBeenCalledWith({
      buffer: Buffer.from('%PDF-1.7'),
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      allowInlineFallback: false,
    });
    expect(result.artifacts).toEqual([
      {
        id: 'doc_terminal',
        kind: 'document',
        format: 'pdf',
        title: 'dist/report.pdf',
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 8,
        fileKey: 'private/agent/report.pdf',
        inline: false,
      },
    ]);
    expect(result.previewFiles).toBeUndefined();
    expect(mockStoreArtifacts).toHaveBeenCalledWith(result.artifacts);
    expect(mockWriteAgentAction).toHaveBeenCalledWith(
      models,
      expect.objectContaining({
        status: 'success',
        args: expect.objectContaining({ previewFileCount: 1 }),
      }),
    );
  });

  it('batches preview metadata after uploading selected files', async () => {
    mockRunSandboxCommand.mockResolvedValueOnce({
      cwd: '/workspace',
      exitCode: 0,
      stdout: '',
      stderr: '',
      durationMs: 12,
      truncated: false,
      workspaceReused: true,
      previewFiles: [
        {
          path: 'dist/report.pdf',
          fileName: 'report.pdf',
          buffer: Buffer.from('%PDF-1.7'),
        },
        {
          path: 'dist/table.xlsx',
          fileName: 'table.xlsx',
          buffer: Buffer.from('xlsx'),
        },
      ],
    });
    const tool = asTool(
      createTerminalTool({ models: {} as IModels, agentId: 'agent-1' }),
    );

    const result = await tool.execute({ command: 'build-all' });

    expect(result.artifacts).toHaveLength(2);
    expect(mockStoreArtifacts).toHaveBeenCalledTimes(1);
    expect(mockStoreArtifacts).toHaveBeenCalledWith(result.artifacts);
  });

  it('reports unavailable private storage instead of persisting inline data', async () => {
    mockPersistGeneratedFile.mockRejectedValueOnce(
      new Error('storage unavailable'),
    );
    const tool = asTool(
      createTerminalTool({ models: {} as IModels, agentId: 'agent-1' }),
    );

    await expect(tool.execute({ command: 'build-report' })).rejects.toThrow(
      'Could not persist the generated preview to private file storage',
    );
    expect(mockStoreArtifacts).not.toHaveBeenCalled();
  });
});

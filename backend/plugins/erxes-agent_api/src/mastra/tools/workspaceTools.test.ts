const mockWriteSandboxWorkspaceFiles = jest.fn();
const mockCaptureSandboxWebsite = jest.fn();
const mockPublishPreviewWebsite = jest.fn();
const mockStoreWebsiteArtifact = jest.fn();
const mockGetCurrentAuth = jest.fn();
const mockDeleteWebsiteFiles = jest.fn();
const mockWriteAgentAction = jest.fn();

jest.mock('@mastra/core/tools', () => ({
  createTool: (config: unknown) => config,
}));
jest.mock('~/mastra/sandbox/commandService', () => ({
  writeSandboxWorkspaceFiles: (...args: unknown[]) =>
    mockWriteSandboxWorkspaceFiles(...args),
  captureSandboxWebsite: (...args: unknown[]) =>
    mockCaptureSandboxWebsite(...args),
}));
jest.mock('./previewPublisher', () => ({
  publishPreviewWebsite: (...args: unknown[]) =>
    mockPublishPreviewWebsite(...args),
}));
jest.mock('~/mastra/artifactStore', () => ({
  storeWebsiteArtifact: (...args: unknown[]) =>
    mockStoreWebsiteArtifact(...args),
}));
jest.mock('~/mastra/files/websiteFileStore', () => ({
  deleteWebsiteFiles: (...args: unknown[]) => mockDeleteWebsiteFiles(...args),
}));
jest.mock('~/mastra/requestContext', () => ({
  getCurrentAuth: (...args: unknown[]) => mockGetCurrentAuth(...args),
}));
jest.mock('~/mastra/auditLog', () => ({
  writeAgentAction: (...args: unknown[]) => mockWriteAgentAction(...args),
}));

import type { IModels } from '~/connectionResolvers';
import {
  createPublishWebsiteTool,
  createWorkspaceWriteTool,
} from './workspaceTools';

const models = {} as IModels;
const asTool = (tool: unknown) =>
  tool as {
    execute: (input: Record<string, unknown>) => Promise<unknown>;
  };

const websiteArtifact = {
  id: 'site_1',
  kind: 'website' as const,
  title: 'Launch',
  entryPath: 'index.html',
  fileCount: 1,
  contentHash: 'a'.repeat(64),
  previewToken: 'preview-token',
  fileName: 'index.html',
  mimeType: 'text/html; charset=utf-8',
  fileKey: 'private/site/index.html',
  size: 15,
  inline: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentAuth.mockReturnValue({
    subdomain: 'tenant',
    agentId: 'agent-1',
    threadId: 'thread-1',
    turnId: 'turn-1',
  });
  mockWriteSandboxWorkspaceFiles.mockResolvedValue({
    cwd: '/workspace/project',
    workspaceReused: true,
    files: [{ path: 'index.html', size: 15 }],
  });
  mockCaptureSandboxWebsite.mockResolvedValue({
    cwd: '/workspace/project',
    workspaceReused: true,
    website: {
      root: 'project/dist',
      entryPath: 'index.html',
      files: [],
    },
  });
  mockPublishPreviewWebsite.mockResolvedValue({
    artifact: websiteArtifact,
    files: [
      {
        path: 'index.html',
        fileKey: 'private/site/index.html',
        mimeType: 'text/html; charset=utf-8',
        size: 15,
        sha256: 'b'.repeat(64),
        inline: false,
      },
    ],
  });
  mockStoreWebsiteArtifact.mockResolvedValue(undefined);
});

describe('structured sandbox tools', () => {
  it('writes complete files without placing source contents in the audit log', async () => {
    const tool = asTool(
      createWorkspaceWriteTool({ models, agentId: 'agent-1' }),
    );
    const input = {
      cwd: 'project',
      files: [{ path: 'index.html', content: '<h1>Ready</h1>' }],
    };

    const result = await tool.execute(input);

    expect(mockWriteSandboxWorkspaceFiles).toHaveBeenCalledWith(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      input,
    );
    expect(result).toEqual({
      cwd: '/workspace/project',
      workspaceReused: true,
      files: [{ path: 'index.html', size: 15 }],
    });
    const auditRecord = mockWriteAgentAction.mock.calls[0][1];
    expect(auditRecord.args.files).toEqual([
      { path: 'index.html', sha256: expect.stringMatching(/^[a-f0-9]{64}$/) },
    ]);
    expect(JSON.stringify(auditRecord)).not.toContain('<h1>Ready</h1>');
  });

  it('publishes one website artifact only after its manifest is stored', async () => {
    const tool = asTool(
      createPublishWebsiteTool({ models, agentId: 'agent-1' }),
    );
    const input = {
      cwd: 'project',
      root: 'dist',
      entry: 'index.html',
      title: 'Launch',
    };

    const result = await tool.execute(input);

    expect(mockCaptureSandboxWebsite).toHaveBeenCalledWith(
      models,
      { agentId: 'agent-1', threadId: 'thread-1', subdomain: 'tenant' },
      input,
    );
    expect(mockPublishPreviewWebsite).toHaveBeenCalledWith(
      models,
      expect.objectContaining({ entryPath: 'index.html' }),
    );
    expect(mockStoreWebsiteArtifact).toHaveBeenCalledWith(
      websiteArtifact,
      expect.arrayContaining([
        expect.objectContaining({ path: 'index.html', sha256: 'b'.repeat(64) }),
      ]),
    );
    expect(result).toEqual({ artifact: websiteArtifact });
  });

  it('does not repeat website publication after a failure in the same turn', async () => {
    mockPublishPreviewWebsite.mockRejectedValueOnce(
      new Error('storage unavailable'),
    );
    const tool = asTool(
      createPublishWebsiteTool({ models, agentId: 'agent-1' }),
    );
    const input = {
      cwd: 'project',
      root: 'dist',
      entry: 'index.html',
    };

    await expect(tool.execute(input)).rejects.toThrow(
      'Website publishing failed. Do not retry this turn.',
    );
    await expect(tool.execute(input)).rejects.toThrow(
      'Website publishing already ran in this turn',
    );
    expect(mockCaptureSandboxWebsite).toHaveBeenCalledTimes(1);
    expect(mockPublishPreviewWebsite).toHaveBeenCalledTimes(1);
  });

  it('rejects a mismatched agent execution context', async () => {
    mockGetCurrentAuth.mockReturnValue({
      subdomain: 'tenant',
      agentId: 'other-agent',
      threadId: 'thread-1',
    });
    const tool = asTool(
      createWorkspaceWriteTool({ models, agentId: 'agent-1' }),
    );

    await expect(
      tool.execute({ files: [{ path: 'index.html', content: 'safe' }] }),
    ).rejects.toThrow('Workspace execution context is invalid');
    expect(mockWriteSandboxWorkspaceFiles).not.toHaveBeenCalled();
  });
});

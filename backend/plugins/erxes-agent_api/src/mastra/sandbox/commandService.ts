import { randomUUID } from 'node:crypto';
import { posix as path } from 'node:path';
import { Sandbox } from '@alibaba-group/opensandbox';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import type { IMastraSandboxSessionDocument } from '@/sandbox/@types/session';
import {
  resolveOpenSandboxRuntimeConfig,
  type OpenSandboxRuntimeConfig,
} from './config';

const SANDBOX_LIFETIME_SECONDS = 60 * 60;
const LEASE_MILLISECONDS = 3 * 60 * 1000;
const OUTPUT_LIMIT_BYTES = 64 * 1024;
export const TERMINAL_COMMAND_MAX_BYTES = 8 * 1024;
const SANDBOX_USER_ID = 65534;
const WORKSPACE_ROOT = '/workspace';
const MAX_PREVIEW_FILES = 8;
const MAX_WEBSITE_FILES = 128;
const MAX_WEBSITE_DEPTH = 32;
const MAX_WEBSITE_REWRITTEN_TEXT_BYTES = 4 * 1024 * 1024;
const REWRITTEN_WEBSITE_EXTENSIONS: Record<string, true> = {
  '.css': true,
  '.htm': true,
  '.html': true,
};
const MAX_PREVIEW_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PREVIEW_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_WORKSPACE_WRITE_FILES = 32;
const MAX_WORKSPACE_FILE_BYTES = 1024 * 1024;
const MAX_WORKSPACE_WRITE_BYTES = 4 * 1024 * 1024;

const NETWORK_ISOLATION_PROBE =
  'if command -v wget >/dev/null 2>&1; then ! wget -q -T 3 -O /dev/null http://1.1.1.1/cdn-cgi/trace; ' +
  'elif command -v curl >/dev/null 2>&1; then ! curl -sS --connect-timeout 3 -o /dev/null http://1.1.1.1/cdn-cgi/trace; ' +
  'else exit 125; fi';

export interface SandboxCommandInput {
  command: string;
  cwd?: string;
  timeoutSeconds?: number;
  previewPaths?: string[];
}

export interface SandboxCommandResult {
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
  workspaceReused: boolean;
  previewFiles?: SandboxPreviewFile[];
}

export interface SandboxPreviewFile {
  path: string;
  fileName: string;
  buffer: Buffer;
}

export interface SandboxWebsiteInput {
  root: string;
  entry?: string;
  title?: string;
}

export interface SandboxPreviewWebsite {
  root: string;
  entryPath: string;
  title?: string;
  files: SandboxPreviewFile[];
}

export interface SandboxSessionIdentity {
  agentId: string;
  threadId: string;
  subdomain: string;
}
const workspaceOperationTails = new Map<string, Promise<void>>();

const serializeWorkspaceOperation = async <T>(
  identity: SandboxSessionIdentity,
  operation: () => Promise<T>,
): Promise<T> => {
  const key = `${identity.subdomain}:${identity.agentId}:${identity.threadId}`;
  const previous = workspaceOperationTails.get(key) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => current);
  workspaceOperationTails.set(key, tail);

  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release?.();
    if (workspaceOperationTails.get(key) === tail) {
      workspaceOperationTails.delete(key);
    }
  }
};

export interface SandboxWorkspaceFileInput {
  path: string;
  content: string;
}

export interface SandboxWorkspaceWriteResult {
  cwd: string;
  workspaceReused: boolean;
  files: Array<{ path: string; size: number }>;
}

export interface SandboxWebsiteCaptureResult {
  cwd: string;
  workspaceReused: boolean;
  website: SandboxPreviewWebsite;
}

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return error.code === 11000;
};

const acquireSession = async (
  models: IModels,
  identity: SandboxSessionIdentity,
): Promise<{ session: IMastraSandboxSessionDocument; leaseId: string }> => {
  const now = new Date();
  const leaseId = randomUUID();
  const leaseExpiresAt = new Date(now.getTime() + LEASE_MILLISECONDS);
  try {
    const session = await models.MastraSandboxSession.findOneAndUpdate(
      {
        agentId: identity.agentId,
        threadId: identity.threadId,
        $or: [
          { leaseId: { $exists: false } },
          { leaseId: null },
          { leaseExpiresAt: { $lte: now } },
        ],
      },
      {
        $set: { leaseId, leaseExpiresAt },
        $setOnInsert: {
          agentId: identity.agentId,
          threadId: identity.threadId,
          expiresAt: leaseExpiresAt,
        },
      },
      { upsert: true, new: true },
    );
    if (!session) throw new Error('Workspace lease was not acquired');
    return { session, leaseId };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ExpectedError(
        'This agent workspace is busy. Wait for its current command to finish.',
      );
    }
    throw error;
  }
};

const releaseSession = async (
  models: IModels,
  sessionId: string,
  leaseId: string,
): Promise<void> => {
  await models.MastraSandboxSession.updateOne(
    { _id: sessionId, leaseId },
    { $unset: { leaseId: 1, leaseExpiresAt: 1 } },
  );
};

const createSandbox = async (
  models: IModels,
  session: IMastraSandboxSessionDocument,
  leaseId: string,
  identity: SandboxSessionIdentity,
  runtime: OpenSandboxRuntimeConfig,
): Promise<Sandbox> => {
  const sandbox = await Sandbox.create({
    connectionConfig: runtime.connection,
    image: runtime.image,
    timeoutSeconds: SANDBOX_LIFETIME_SECONDS,
    // Docker runtime does not support per-sandbox secureAccess tokens. The
    // endpoint remains private: host ports bind to loopback and every SDK call
    // uses the API-key-protected control-plane proxy.
    secureAccess: false,
    // Zero egress is enforced by the control plane's internal Docker network.
    // OpenSandbox rejects per-sandbox networkPolicy with a user-defined network,
    // so creation below verifies the invariant before accepting the workspace.
    metadata: {
      owner: 'erxes-agent',
      tenant: identity.subdomain,
      agent: identity.agentId,
      thread: identity.threadId,
    },
  });

  try {
    const bootstrap = await sandbox.commands.run(
      `mkdir -p ${WORKSPACE_ROOT}/.tmp && chown -R ${SANDBOX_USER_ID}:${SANDBOX_USER_ID} ${WORKSPACE_ROOT}`,
      { timeoutSeconds: 15 },
    );
    if (bootstrap.exitCode !== 0) {
      throw new Error('Sandbox workspace initialization failed');
    }
    const isolationProbe = await sandbox.commands.run(NETWORK_ISOLATION_PROBE, {
      timeoutSeconds: 5,
      uid: SANDBOX_USER_ID,
      gid: SANDBOX_USER_ID,
    });
    if (isolationProbe.exitCode !== 0) {
      throw new Error('Sandbox network isolation check failed');
    }
    const expiresAt = new Date(Date.now() + SANDBOX_LIFETIME_SECONDS * 1000);
    await models.MastraSandboxSession.updateOne(
      { _id: session._id, leaseId },
      { $set: { sandboxId: sandbox.id, expiresAt } },
    );
    return sandbox;
  } catch (error) {
    await sandbox.kill().catch(() => undefined);
    await sandbox.close().catch(() => undefined);
    throw error;
  }
};

const connectSandbox = async (
  models: IModels,
  session: IMastraSandboxSessionDocument,
  leaseId: string,
  identity: SandboxSessionIdentity,
  runtime: OpenSandboxRuntimeConfig,
): Promise<{ sandbox: Sandbox; reused: boolean }> => {
  if (
    session.sandboxId &&
    session.expiresAt &&
    session.expiresAt > new Date()
  ) {
    try {
      const sandbox = await Sandbox.connect({
        connectionConfig: runtime.connection,
        sandboxId: session.sandboxId,
      });
      await sandbox.renew(SANDBOX_LIFETIME_SECONDS);
      await models.MastraSandboxSession.updateOne(
        { _id: session._id, leaseId },
        {
          $set: {
            expiresAt: new Date(Date.now() + SANDBOX_LIFETIME_SECONDS * 1000),
          },
        },
      );
      return { sandbox, reused: true };
    } catch {
      // Preserve the previous expiry as a cleanup deadline if replacement fails.
    }
  }

  return {
    sandbox: await createSandbox(models, session, leaseId, identity, runtime),
    reused: false,
  };
};

const resolveWorkingDirectory = (cwd?: string): string => {
  const relative = (cwd || '.').trim();
  if (!relative || relative === '.') return WORKSPACE_ROOT;
  if (path.isAbsolute(relative)) {
    throw new ExpectedError('Terminal working directory must be relative.');
  }
  const normalized = path.normalize(relative);
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new ExpectedError(
      'Terminal working directory must stay in /workspace.',
    );
  }
  return path.join(WORKSPACE_ROOT, normalized);
};

interface ResolvedWorkspaceFile {
  absolutePath: string;
  relativePath: string;
  content: string;
  size: number;
}

const resolveWorkspaceFiles = (
  workingDirectory: string,
  files: SandboxWorkspaceFileInput[],
): ResolvedWorkspaceFile[] => {
  if (!files.length) {
    throw new ExpectedError('Workspace write requires at least one file.');
  }
  if (files.length > MAX_WORKSPACE_WRITE_FILES) {
    throw new ExpectedError(
      `Workspace write accepts at most ${MAX_WORKSPACE_WRITE_FILES} files per call.`,
    );
  }

  let totalBytes = 0;
  const seen = new Set<string>();
  return files.map((file) => {
    const relative = file.path.trim();
    if (!relative || path.isAbsolute(relative)) {
      throw new ExpectedError('Workspace file paths must be relative.');
    }
    const normalized = path.normalize(relative);
    if (
      normalized === '.' ||
      normalized === '..' ||
      normalized.startsWith('../')
    ) {
      throw new ExpectedError(
        'Workspace file paths must stay in the working directory.',
      );
    }
    if (seen.has(normalized)) {
      throw new ExpectedError(
        `Duplicate workspace file path: "${normalized}".`,
      );
    }
    seen.add(normalized);

    const size = Buffer.byteLength(file.content);
    if (size > MAX_WORKSPACE_FILE_BYTES) {
      throw new ExpectedError(
        `Workspace file "${normalized}" is too large (max 1MB).`,
      );
    }
    totalBytes += size;
    if (totalBytes > MAX_WORKSPACE_WRITE_BYTES) {
      throw new ExpectedError('Workspace write exceeds the 4MB total limit.');
    }

    const absolutePath = path.join(workingDirectory, normalized);
    const workspaceRelativePath = path.relative(WORKSPACE_ROOT, absolutePath);
    if (
      !workspaceRelativePath ||
      workspaceRelativePath === '..' ||
      workspaceRelativePath.startsWith('../')
    ) {
      throw new ExpectedError('Workspace files must stay in /workspace.');
    }
    return {
      absolutePath,
      relativePath: normalized,
      content: file.content,
      size,
    };
  });
};

interface ResolvedPreviewPath {
  absolutePath: string;
  relativePath: string;
}

const resolvePreviewPaths = (
  workingDirectory: string,
  values?: string[],
): ResolvedPreviewPath[] => {
  const paths = [...new Set(values ?? [])];
  if (paths.length > MAX_PREVIEW_FILES) {
    throw new ExpectedError(
      `Terminal can publish at most ${MAX_PREVIEW_FILES} files per command.`,
    );
  }

  return paths.map((value) => {
    const relative = value.trim();
    if (!relative || path.isAbsolute(relative)) {
      throw new ExpectedError('Terminal preview paths must be relative files.');
    }
    const normalized = path.normalize(relative);
    if (normalized === '..' || normalized.startsWith('../')) {
      throw new ExpectedError(
        'Terminal preview paths must stay in the working directory.',
      );
    }
    const absolutePath = path.join(workingDirectory, normalized);
    const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);
    if (
      !relativePath ||
      relativePath === '..' ||
      relativePath.startsWith('../')
    ) {
      throw new ExpectedError(
        'Terminal preview paths must stay in /workspace.',
      );
    }
    return { absolutePath, relativePath };
  });
};

const readPreviewFiles = async (
  sandbox: Sandbox,
  paths: ResolvedPreviewPath[],
  maxTotalBytes = MAX_PREVIEW_TOTAL_BYTES,
): Promise<SandboxPreviewFile[]> => {
  if (!paths.length) return [];
  const infoByPath = await sandbox.files.getFileInfo(
    paths.map(({ absolutePath }) => absolutePath),
  );
  let declaredBytes = 0;
  for (const { absolutePath, relativePath } of paths) {
    const info = infoByPath[absolutePath];
    if (!info || info.type !== 'file') {
      throw new ExpectedError(
        `Terminal preview file "${relativePath}" was not found or is not a regular file.`,
      );
    }
    if (typeof info.size === 'number' && info.size > MAX_PREVIEW_FILE_BYTES) {
      throw new ExpectedError(
        `Terminal preview file "${relativePath}" is too large (max 20MB).`,
      );
    }
    declaredBytes += info.size ?? 0;
  }
  if (declaredBytes > maxTotalBytes) {
    throw new ExpectedError(
      'Terminal preview files exceed the 40MB total limit.',
    );
  }

  const files: SandboxPreviewFile[] = [];
  let actualBytes = 0;
  for (const { absolutePath, relativePath } of paths) {
    const bytes = await sandbox.files.readBytes(absolutePath, {
      limit: MAX_PREVIEW_FILE_BYTES + 1,
    });
    if (bytes.byteLength > MAX_PREVIEW_FILE_BYTES) {
      throw new ExpectedError(
        `Terminal preview file "${relativePath}" is too large (max 20MB).`,
      );
    }
    actualBytes += bytes.byteLength;
    if (actualBytes > maxTotalBytes) {
      throw new ExpectedError(
        'Terminal preview files exceed the 40MB total limit.',
      );
    }
    files.push({
      path: relativePath,
      fileName: path.basename(relativePath),
      buffer: Buffer.from(bytes),
    });
  }
  return files;
};

const normalizeWebsiteRelativePath = (
  value: string,
  label: 'root' | 'entry',
): string => {
  const relative = value.trim();
  if (!relative || path.isAbsolute(relative)) {
    throw new ExpectedError(
      `Terminal website ${label} must be a relative path.`,
    );
  }
  const normalized = path.normalize(relative);
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new ExpectedError(
      `Terminal website ${label} must stay in its working directory.`,
    );
  }
  return normalized;
};

const readPreviewWebsite = async (
  sandbox: Sandbox,
  workingDirectory: string,
  input: SandboxWebsiteInput,
  maxTotalBytes: number,
): Promise<SandboxPreviewWebsite> => {
  const normalizedRoot = normalizeWebsiteRelativePath(input.root, 'root');
  const entryPath = normalizeWebsiteRelativePath(
    input.entry?.trim() || 'index.html',
    'entry',
  );
  const absoluteRoot = path.join(workingDirectory, normalizedRoot);
  const workspaceRoot = path.relative(WORKSPACE_ROOT, absoluteRoot) || '.';
  if (workspaceRoot === '..' || workspaceRoot.startsWith('../')) {
    throw new ExpectedError('Terminal website root must stay in /workspace.');
  }

  const rootInfo = (await sandbox.files.getFileInfo([absoluteRoot]))[
    absoluteRoot
  ];
  if (!rootInfo || rootInfo.type !== 'directory') {
    throw new ExpectedError(
      `Terminal website root "${workspaceRoot}" was not found or is not a directory.`,
    );
  }

  const listed = await sandbox.files.listDirectory({
    path: absoluteRoot,
    depth: MAX_WEBSITE_DEPTH,
  });
  if (listed.some((file) => file.type === 'symlink')) {
    throw new ExpectedError(
      'Terminal website directories cannot contain symbolic links.',
    );
  }

  const resolvedFiles = listed
    .filter((file) => file.type === 'file')
    .map((file) => {
      const absolutePath = path.isAbsolute(file.path)
        ? path.normalize(file.path)
        : path.join(absoluteRoot, file.path);
      const relativePath = path.relative(absoluteRoot, absolutePath);
      if (
        !relativePath ||
        relativePath === '..' ||
        relativePath.startsWith('../')
      ) {
        throw new ExpectedError(
          'Terminal website files must stay inside the published root.',
        );
      }
      return { absolutePath, relativePath, size: file.size };
    });

  if (!resolvedFiles.length) {
    throw new ExpectedError('Terminal website root contains no files.');
  }
  if (resolvedFiles.length > MAX_WEBSITE_FILES) {
    throw new ExpectedError(
      `Terminal website can contain at most ${MAX_WEBSITE_FILES} files.`,
    );
  }
  if (!resolvedFiles.some((file) => file.relativePath === entryPath)) {
    throw new ExpectedError(
      `Terminal website entry "${entryPath}" was not found in the published root.`,
    );
  }

  let declaredBytes = 0;
  for (const file of resolvedFiles) {
    if (typeof file.size === 'number' && file.size > MAX_PREVIEW_FILE_BYTES) {
      throw new ExpectedError(
        `Terminal website file "${file.relativePath}" is too large (max 20MB).`,
      );
    }
    if (
      typeof file.size === 'number' &&
      file.size > MAX_WEBSITE_REWRITTEN_TEXT_BYTES &&
      REWRITTEN_WEBSITE_EXTENSIONS[
        path.extname(file.relativePath).toLowerCase()
      ]
    ) {
      throw new ExpectedError(
        `Terminal website text file "${file.relativePath}" is too large (max 4MB).`,
      );
    }
    declaredBytes += file.size ?? 0;
  }
  if (declaredBytes > maxTotalBytes) {
    throw new ExpectedError(
      'Terminal published files exceed the 40MB total limit.',
    );
  }

  const files: SandboxPreviewFile[] = [];
  let actualBytes = 0;
  for (const file of resolvedFiles) {
    const bytes = await sandbox.files.readBytes(file.absolutePath, {
      limit: MAX_PREVIEW_FILE_BYTES + 1,
    });
    if (bytes.byteLength > MAX_PREVIEW_FILE_BYTES) {
      throw new ExpectedError(
        `Terminal website file "${file.relativePath}" is too large (max 20MB).`,
      );
    }
    if (
      bytes.byteLength > MAX_WEBSITE_REWRITTEN_TEXT_BYTES &&
      REWRITTEN_WEBSITE_EXTENSIONS[
        path.extname(file.relativePath).toLowerCase()
      ]
    ) {
      throw new ExpectedError(
        `Terminal website text file "${file.relativePath}" is too large (max 4MB).`,
      );
    }
    actualBytes += bytes.byteLength;
    if (actualBytes > maxTotalBytes) {
      throw new ExpectedError(
        'Terminal published files exceed the 40MB total limit.',
      );
    }
    files.push({
      path: file.relativePath,
      fileName: path.basename(file.relativePath),
      buffer: Buffer.from(bytes),
    });
  }

  return {
    root: workspaceRoot,
    entryPath,
    title: input.title,
    files,
  };
};

interface SandboxOperationContext {
  sandbox: Sandbox;
  workingDirectory: string;
  workspaceReused: boolean;
}

const withSandboxWorkspace = async <T>(
  models: IModels,
  identity: SandboxSessionIdentity,
  workingDirectory: string,
  operation: (context: SandboxOperationContext) => Promise<T>,
): Promise<T> => {
  const settings = await models.MastraSettings.getSettings();
  const runtime = resolveOpenSandboxRuntimeConfig(settings);
  const { session, leaseId } = await acquireSession(models, identity);
  let sandbox: Sandbox | undefined;

  try {
    const connected = await connectSandbox(
      models,
      session,
      leaseId,
      identity,
      runtime,
    );
    sandbox = connected.sandbox;
    return await operation({
      sandbox,
      workingDirectory,
      workspaceReused: connected.reused,
    });
  } catch (error) {
    await models.MastraSandboxSession.deleteOne({
      _id: session._id,
      leaseId,
      sandboxId: { $exists: false },
    }).catch(() => undefined);
    throw error;
  } finally {
    await sandbox?.close().catch(() => undefined);
    await releaseSession(models, session._id, leaseId).catch(() => undefined);
  }
};

const writeSandboxWorkspaceFilesUnserialized = async (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: { cwd?: string; files: SandboxWorkspaceFileInput[] },
): Promise<SandboxWorkspaceWriteResult> => {
  const workingDirectory = resolveWorkingDirectory(input.cwd);
  const files = resolveWorkspaceFiles(workingDirectory, input.files);

  return withSandboxWorkspace(
    models,
    identity,
    workingDirectory,
    async ({ sandbox, workspaceReused }) => {
      const directories = [
        ...new Set(files.map((file) => path.dirname(file.absolutePath))),
      ].sort((left, right) => left.split('/').length - right.split('/').length);
      await sandbox.files.createDirectories(
        directories.map((directory) => ({
          path: directory,
          mode: 755,
        })),
      );
      await sandbox.files.writeFiles(
        files.map((file) => ({
          path: file.absolutePath,
          data: file.content,
          mode: 644,
        })),
      );
      return {
        cwd: workingDirectory,
        workspaceReused,
        files: files.map((file) => ({
          path: file.relativePath,
          size: file.size,
        })),
      };
    },
  );
};

const captureSandboxWebsiteUnserialized = async (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: SandboxWebsiteInput & { cwd?: string },
): Promise<SandboxWebsiteCaptureResult> => {
  const workingDirectory = resolveWorkingDirectory(input.cwd);
  return withSandboxWorkspace(
    models,
    identity,
    workingDirectory,
    async ({ sandbox, workspaceReused }) => ({
      cwd: workingDirectory,
      workspaceReused,
      website: await readPreviewWebsite(
        sandbox,
        workingDirectory,
        input,
        MAX_PREVIEW_TOTAL_BYTES,
      ),
    }),
  );
};

const appendLimited = (
  current: string,
  text: string,
  remainingBytes: number,
): { value: string; bytes: number; truncated: boolean } => {
  const bytes = Buffer.from(text);
  if (bytes.length <= remainingBytes) {
    return { value: current + text, bytes: bytes.length, truncated: false };
  }
  return {
    value: current + bytes.subarray(0, Math.max(remainingBytes, 0)).toString(),
    bytes: Math.max(remainingBytes, 0),
    truncated: true,
  };
};

const runSandboxCommandUnserialized = async (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: SandboxCommandInput,
): Promise<SandboxCommandResult> => {
  const command = input.command.trim();
  if (!command) throw new ExpectedError('Terminal command is required.');
  if (Buffer.byteLength(command) > TERMINAL_COMMAND_MAX_BYTES) {
    throw new ExpectedError(
      'Terminal commands are limited to 8KB. Write source files with workspaceWrite, then run a short build command.',
    );
  }
  const timeoutSeconds = input.timeoutSeconds ?? 30;
  if (
    !Number.isInteger(timeoutSeconds) ||
    timeoutSeconds < 1 ||
    timeoutSeconds > 120
  ) {
    throw new ExpectedError(
      'Terminal timeout must be between 1 and 120 seconds.',
    );
  }
  const workingDirectory = resolveWorkingDirectory(input.cwd);
  const previewPaths = resolvePreviewPaths(
    workingDirectory,
    input.previewPaths,
  );

  return withSandboxWorkspace(
    models,
    identity,
    workingDirectory,
    async ({ sandbox, workspaceReused }) => {
      let stdout = '';
      let stderr = '';
      let capturedBytes = 0;
      let truncated = false;
      const capture = (channel: 'stdout' | 'stderr', text: string) => {
        const appended = appendLimited(
          channel === 'stdout' ? stdout : stderr,
          text,
          OUTPUT_LIMIT_BYTES - capturedBytes,
        );
        if (channel === 'stdout') stdout = appended.value;
        else stderr = appended.value;
        capturedBytes += appended.bytes;
        truncated ||= appended.truncated;
      };
      const startedAt = Date.now();
      const execution = await sandbox.commands.run(
        command,
        {
          workingDirectory,
          timeoutSeconds,
          uid: SANDBOX_USER_ID,
          gid: SANDBOX_USER_ID,
          envs: {
            HOME: WORKSPACE_ROOT,
            TMPDIR: `${WORKSPACE_ROOT}/.tmp`,
          },
        },
        {
          skipAccumulation: true,
          onStdout: (message) => capture('stdout', message.text),
          onStderr: (message) => capture('stderr', message.text),
          onResult: (result) => {
            if (result.text) capture('stdout', result.text);
          },
        },
      );
      const previewFiles = await readPreviewFiles(sandbox, previewPaths);

      return {
        cwd: workingDirectory,
        exitCode: execution.exitCode ?? null,
        stdout,
        stderr,
        durationMs:
          execution.complete?.executionTimeMs ?? Date.now() - startedAt,
        truncated,
        workspaceReused,
        ...(previewFiles.length ? { previewFiles } : {}),
      };
    },
  );
};

export const writeSandboxWorkspaceFiles = (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: { cwd?: string; files: SandboxWorkspaceFileInput[] },
): Promise<SandboxWorkspaceWriteResult> =>
  serializeWorkspaceOperation(identity, () =>
    writeSandboxWorkspaceFilesUnserialized(models, identity, input),
  );

export const captureSandboxWebsite = (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: SandboxWebsiteInput & { cwd?: string },
): Promise<SandboxWebsiteCaptureResult> =>
  serializeWorkspaceOperation(identity, () =>
    captureSandboxWebsiteUnserialized(models, identity, input),
  );

export const runSandboxCommand = (
  models: IModels,
  identity: SandboxSessionIdentity,
  input: SandboxCommandInput,
): Promise<SandboxCommandResult> =>
  serializeWorkspaceOperation(identity, () =>
    runSandboxCommandUnserialized(models, identity, input),
  );

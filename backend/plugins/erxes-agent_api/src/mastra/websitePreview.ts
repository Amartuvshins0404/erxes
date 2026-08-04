import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { posix as path } from 'node:path';
import type { Readable } from 'node:stream';
import type {
  NextFunction,
  Request,
  Response as ExpressResponse,
  Router,
} from 'express';
import rateLimit from 'express-rate-limit';
import { extractUserFromHeader, getSubdomain } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { openWebsiteFile } from '~/mastra/files/websiteFileStore';
import type { IWebsiteFileReference } from '@/artifact/@types/artifact';

const PUBLIC_WEBSITE_ROUTE = '/pl:erxes-agent/websites';
const READ_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_RESPONSES = 64;
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const MAX_REWRITTEN_TEXT_BYTES = 4 * 1024 * 1024;

const websiteRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many website preview requests. Please try again later.',
});

let activeResponses = 0;
const limitConcurrentResponses = (
  _req: Request,
  res: ExpressResponse,
  next: NextFunction,
): void => {
  if (activeResponses >= MAX_CONCURRENT_RESPONSES) {
    res.status(503).send('Website preview is busy. Please try again.');
    return;
  }

  activeResponses += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activeResponses -= 1;
  };
  res.once('finish', release);
  res.once('close', release);
  next();
};

const normalizeRequestedPath = (value: string): string | null => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  const normalized = path
    .normalize(decoded.replace(/^\/+/, ''))
    .replace(/\/+$/, '');
  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    path.isAbsolute(normalized)
  ) {
    return null;
  }
  return normalized === '.' ? '' : normalized;
};

export const websitePathCandidates = (
  requestedPath: string,
  entryPath: string,
): string[] => {
  const normalized = normalizeRequestedPath(requestedPath);
  if (normalized === null) return [];
  if (!normalized) return [entryPath];

  const candidates = [normalized];
  if (requestedPath.endsWith('/')) {
    candidates.push(`${normalized}/index.html`, entryPath);
  } else if (!path.extname(normalized)) {
    candidates.push(
      `${normalized}.html`,
      `${normalized}/index.html`,
      entryPath,
    );
  }
  return [...new Set(candidates)];
};

const localhostOriginPattern =
  /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//gi;
const rootAttributePattern =
  /(\b(?:href|src|action|poster)\s*=\s*["'])\/(?!\/)/gi;
const rootSrcsetPattern = /(\bsrcset\s*=\s*["'])([^"']*)(["'])/gi;
const rootCssUrlPattern = /(url\(\s*["']?)\/(?!\/)/gi;
const rootCssImportPattern = /(@import\s+["'])\/(?!\/)/gi;

export const rewriteWebsiteText = (
  source: string,
  mimeType: string,
  siteBase: string,
): string => {
  const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`;
  let rewritten = source;
  if (mimeType.startsWith('text/html')) {
    rewritten = rewritten
      .replace(rootAttributePattern, `$1${base}`)
      .replace(
        rootSrcsetPattern,
        (_match: string, start: string, value: string, end: string) =>
          `${start}${value.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}`)}${end}`,
      )
      .replace(rootCssUrlPattern, `$1${base}`)
      .replace(rootCssImportPattern, `$1${base}`);
  } else if (mimeType.startsWith('text/css')) {
    rewritten = rewritten
      .replace(rootCssUrlPattern, `$1${base}`)
      .replace(rootCssImportPattern, `$1${base}`);
  }

  return rewritten.replace(localhostOriginPattern, base);
};

const waitForDrainOrClose = async (res: ExpressResponse): Promise<void> => {
  const controller = new AbortController();
  try {
    await Promise.race([
      once(res, 'drain', { signal: controller.signal }),
      once(res, 'close', { signal: controller.signal }),
    ]);
  } finally {
    controller.abort();
  }
};

const readStreamText = async (
  source: Readable,
  maxBytes: number,
): Promise<string> => {
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let receivedBytes = 0;

  for await (const chunk of source) {
    const value = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as string | Uint8Array);
    receivedBytes += value.length;
    if (receivedBytes > maxBytes) {
      throw new Error('Website response exceeded its size limit');
    }
    parts.push(decoder.decode(value, { stream: true }));
  }
  parts.push(decoder.decode());
  return parts.join('');
};

const streamResponse = async (
  source: Readable,
  res: ExpressResponse,
  maxBytes: number,
): Promise<void> => {
  let receivedBytes = 0;
  for await (const chunk of source) {
    if (res.destroyed) break;
    const value = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as string | Uint8Array);
    receivedBytes += value.length;
    if (receivedBytes > maxBytes) {
      throw new Error('Website response exceeded its size limit');
    }
    if (!res.write(value)) await waitForDrainOrClose(res);
  }
  if (!res.destroyed) res.end();
};

const respondNotModified = (
  req: Request,
  res: ExpressResponse,
  digest: string,
): boolean => {
  const etag = `"sha256-${digest}"`;
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  const requested = req.headers['if-none-match'];
  const values = Array.isArray(requested) ? requested : requested?.split(',');
  if (!values?.some((value) => value.trim() === etag)) return false;
  res.status(304).end();
  return true;
};

export const registerWebsitePreviewRoutes = (router: Router): void => {
  router.get(
    '/websites/:artifactId/:previewToken/*',
    websiteRouteLimiter,
    limitConcurrentResponses,
    async (req, res) => {
      const user = extractUserFromHeader(req.headers);
      const subdomain = getSubdomain(req);
      const models = await generateModels(subdomain);
      const artifact = await models.MastraArtifact.getByArtifactId(
        req.params.artifactId,
      );
      if (
        !artifact ||
        artifact.kind !== 'website' ||
        !artifact.entryPath ||
        !artifact.previewToken ||
        artifact.previewToken !== req.params.previewToken ||
        !artifact.websiteFiles?.length ||
        !user?._id ||
        artifact.initiatorUserId !== String(user._id)
      ) {
        return res.status(404).send('Website not found');
      }

      const requestedPath = req.params[0] || artifact.entryPath;
      const candidates = websitePathCandidates(
        requestedPath,
        artifact.entryPath,
      );
      const file = candidates
        .map((candidate) =>
          artifact.websiteFiles?.find((member) => member.path === candidate),
        )
        .find((candidate): candidate is IWebsiteFileReference => !!candidate);
      if (!file || file.inline || /^https?:\/\//i.test(file.fileKey)) {
        return res.status(404).send('Website file not found');
      }

      const rewrittenText =
        file.mimeType.startsWith('text/html') ||
        file.mimeType.startsWith('text/css');
      const maxBytes = rewrittenText
        ? MAX_REWRITTEN_TEXT_BYTES
        : MAX_RESPONSE_BYTES;
      if (
        !Number.isSafeInteger(file.size) ||
        file.size < 0 ||
        file.size > maxBytes
      ) {
        return res.status(413).send('Website file is too large');
      }

      const fileName = path.basename(file.path).replace(/["\r\n]/g, '_');
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      if (!rewrittenText && respondNotModified(req, res, file.sha256)) {
        return undefined;
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader(
        'Content-Security-Policy',
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:",
      );

      const siteBase = `${PUBLIC_WEBSITE_ROUTE}/${encodeURIComponent(
        artifact.artifactId,
      )}/${encodeURIComponent(artifact.previewToken)}/`;
      if (file.mimeType.startsWith('text/html')) {
        res.setHeader(
          'Content-Security-Policy',
          "sandbox allow-scripts; base-uri 'none'; object-src 'none'; form-action 'none'; default-src 'none'; script-src 'self' blob: 'unsafe-inline'; style-src 'self' data: blob: 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'none'; frame-src 'none'",
        );
      }

      const source = await openWebsiteFile(models, file.fileKey).catch(
        () => null,
      );
      if (!source) return res.status(502).send('Website file is unavailable');
      const timeout = setTimeout(
        () => source.destroy(new Error('Website file read timed out')),
        READ_TIMEOUT_MS,
      );
      res.once('close', () => {
        if (!res.writableEnded) source.destroy();
      });
      try {
        if (rewrittenText) {
          const original = await readStreamText(source, maxBytes);
          const rendered = rewriteWebsiteText(
            original,
            file.mimeType,
            siteBase,
          );
          const digest = createHash('sha256').update(rendered).digest('hex');
          if (respondNotModified(req, res, digest)) return undefined;
          return res.send(rendered);
        }

        await streamResponse(source, res, maxBytes);
        return undefined;
      } catch (error) {
        if (!res.headersSent) {
          return res.status(502).send('Website file is unavailable');
        }
        res.destroy(error instanceof Error ? error : undefined);
        return undefined;
      } finally {
        clearTimeout(timeout);
        if (!source.destroyed) source.destroy();
      }
    },
  );
};

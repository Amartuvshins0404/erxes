import type {
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import {
  extractUserFromHeader,
  getPlugins,
  getSubdomain,
} from 'erxes-api-shared/utils';
import { checkPermissionGroup } from 'erxes-api-shared/core-modules';
import { generateModels } from '~/connectionResolvers';
import {
  invalidateNativeToolRegistry,
  SELF_PLUGIN_NAME,
} from '~/mastra/tools/nativeTools';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import { buildPluginToolsEntry } from '@/plugintools/inventory';

// Bound on the per-tool disable list so a corrupted payload can't balloon the
// stored document. The actual manifest surface is far below this.
const MAX_DISABLED_TOOLS = 2000;

type CurationBody = {
  plugin: string;
  enabled: boolean;
  disabledTools: string[];
};

function parseCurationBody(raw: unknown): CurationBody | null {
  const body = (raw ?? {}) as Record<string, unknown>;

  if (typeof body.plugin !== 'string' || !body.plugin.trim()) return null;
  if (typeof body.enabled !== 'boolean') return null;

  let disabledTools: string[] = [];
  if (body.disabledTools === undefined || body.disabledTools === null) {
    disabledTools = [];
  } else if (
    Array.isArray(body.disabledTools) &&
    body.disabledTools.length <= MAX_DISABLED_TOOLS &&
    body.disabledTools.every((id) => typeof id === 'string' && id)
  ) {
    disabledTools = body.disabledTools;
  } else {
    return null;
  }

  return { plugin: body.plugin, enabled: body.enabled, disabledTools };
}

/**
 * The plugin's global cors() stamps `Access-Control-Allow-Origin: *` on every
 * response, and the gateway proxy pipes upstream headers over its own
 * whitelist-scoped ones. Browsers reject a wildcard origin on credentialed
 * requests ("Failed to fetch"), so drop it here (same as /chat/stream) and let
 * the gateway's CORS headers stand.
 */
const stripWildcardOrigin = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.removeHeader('Access-Control-Allow-Origin');
  next();
};

/**
 * Admin REST surface for the per-plugin agent-tool curation, reached through
 * the gateway proxy at /pl:erxes-agent/plugin-tools (+ /curation). The gateway
 * has already authenticated the browser session and forwarded the user as a
 * base64 header (same as /chat/stream).
 */
export const registerPluginToolsRoutes = (router: Router) => {
  router.get('/plugin-tools', stripWildcardOrigin, async (req, res) => {
    const user = extractUserFromHeader(req.headers);
    if (!user?._id) {
      return res.status(401).json({ error: 'Login required' });
    }

    const subdomain = getSubdomain(req);

    try {
      await checkPermissionGroup(subdomain, user)(
        ERXES_AGENT_ACTIONS.settings.statusRead,
      );
    } catch {
      return res.status(403).json({ error: 'Permission required' });
    }

    try {
      const models = await generateModels(subdomain);
      const pluginNames = (await getPlugins()).filter(
        (name) => name && name !== SELF_PLUGIN_NAME,
      );
      const curations = await models.MastraPluginToolCuration.find({}).lean();
      const curationByPlugin = new Map(
        curations.map((row) => [row.plugin, row]),
      );

      const entries = await Promise.all(
        pluginNames.map((plugin) =>
          buildPluginToolsEntry(
            subdomain,
            plugin,
            curationByPlugin.get(plugin) ?? null,
          ),
        ),
      );

      return res.json(entries);
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load plugin tools',
      });
    }
  });

  router.post(
    '/plugin-tools/curation',
    stripWildcardOrigin,
    async (req, res) => {
    const user = extractUserFromHeader(req.headers);
    if (!user?._id) {
      return res.status(401).json({ error: 'Login required' });
    }

    const subdomain = getSubdomain(req);

    try {
      await checkPermissionGroup(subdomain, user)(
        ERXES_AGENT_ACTIONS.settings.manage,
      );
    } catch {
      return res.status(403).json({ error: 'Permission required' });
    }

    const parsed = parseCurationBody(req.body);
    if (!parsed) {
      return res
        .status(400)
        .json({ error: 'Invalid curation payload' });
    }

    try {
      const models = await generateModels(subdomain);

      const pluginNames = await getPlugins();
      if (!pluginNames.includes(parsed.plugin)) {
        return res
          .status(404)
          .json({ error: `Plugin '${parsed.plugin}' is not an active plugin.` });
      }

      const row = await models.MastraPluginToolCuration.saveCuration({
        plugin: parsed.plugin,
        enabled: parsed.enabled,
        disabledTools: parsed.disabledTools,
      });

      // The registry caches curated manifests per tenant; drop the cache so the
      // next agent build sees the new surface immediately.
      invalidateNativeToolRegistry();

      return res.json(await buildPluginToolsEntry(subdomain, parsed.plugin, row));
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update plugin tools',
      });
    }
  });
};
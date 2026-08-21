import { getPlugin, type AgentToolDescriptor } from 'erxes-api-shared/utils';
import { fetchPluginManifest } from '~/mastra/tools/nativeTools';
import { IPluginToolCuration } from '@/plugintools/@types/pluginTools';

export interface MastraPluginToolItem {
  id: string;
  kind: string;
  module: string | null;
  method: string | null;
  destructive: boolean | null;
  description: string | null;
  agentUsable: boolean;
  permissionAction: string | null;
}

export interface MastraPluginToolsEntry {
  plugin: string;
  supported: boolean;
  enabled: boolean;
  disabledTools: string[];
  tools: MastraPluginToolItem[];
}

const toToolItem = (descriptor: AgentToolDescriptor): MastraPluginToolItem => ({
  id: descriptor.id,
  kind: descriptor.kind,
  module: descriptor.module ?? null,
  method: descriptor.method ?? null,
  destructive: descriptor.destructive ?? null,
  description: descriptor.description ?? null,
  agentUsable: Boolean(descriptor.permission?.action),
  permissionAction: descriptor.permission?.action ?? null,
});

/**
 * Fetch one plugin's full tool inventory (including agentUsable=false
 * entries — curation UIs need the complete surface) and merge the tenant's
 * curation state. `supported` is false whenever the plugin's manifest
 * endpoint cannot be reached or answers an error envelope.
 */
export const buildPluginToolsEntry = async (
  subdomain: string,
  plugin: string,
  curation: Pick<IPluginToolCuration, 'enabled' | 'disabledTools'> | null,
): Promise<MastraPluginToolsEntry> => {
  const enabled = curation?.enabled === true;
  const disabledTools = curation?.disabledTools ?? [];

  try {
    const record = await getPlugin(plugin);
    const address = record?.address?.trim();

    if (!address) {
      return { plugin, supported: false, enabled, disabledTools, tools: [] };
    }

    const manifest = await fetchPluginManifest(subdomain, address);

    if (!manifest.supported) {
      return { plugin, supported: false, enabled, disabledTools, tools: [] };
    }

    return {
      plugin,
      supported: true,
      enabled,
      disabledTools,
      tools: manifest.tools.map(toToolItem),
    };
  } catch {
    return { plugin, supported: false, enabled, disabledTools, tools: [] };
  }
};

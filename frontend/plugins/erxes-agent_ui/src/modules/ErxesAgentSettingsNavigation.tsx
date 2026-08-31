import { IconSparkles } from '@tabler/icons-react';
import { SettingsNavigationMenuLinkItem, Sidebar } from 'erxes-ui';

/**
 * Settings sidebar group registered through `CONFIG.settingsNavigation`.
 * `SettingsNavigationMenuLinkItem` prefixes the link with `settings/`, so the
 * entry points at `/settings/erxes-agent/connection` where the host mounts
 * this remote's settings expose (`./erxes_agentSettings`).
 */
export const ErxesAgentSettingsNavigation = () => {
  return (
    <Sidebar.Group>
      <Sidebar.GroupLabel className="h-4">Agents</Sidebar.GroupLabel>
      <Sidebar.GroupContent className="pt-1">
        <Sidebar.Menu>
          <SettingsNavigationMenuLinkItem
            pathPrefix="erxes-agent"
            path="/connection"
            name="API key"
            icon={IconSparkles}
          />
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};

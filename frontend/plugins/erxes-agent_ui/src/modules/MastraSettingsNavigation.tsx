import { SettingsNavigationMenuLinkItem, Sidebar } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

export const MastraSettingsNavigation = () => {
  const { hasActionPermission } = usePermissionCheck();
  const canReadSkills = hasActionPermission(ERXES_AGENT_ACTIONS.skills.read);
  const canReadProviders = hasActionPermission(
    ERXES_AGENT_ACTIONS.provider.configRead,
  );
  const canReadSettingsStatus = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.statusRead,
  );
  const canManageSettings = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.manage,
  );
  const canManageVoice = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.voiceManage,
  );
  const canManageQuotas = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.quotasManage,
  );
  if (
    !canReadSkills &&
    !canReadProviders &&
    !canReadSettingsStatus &&
    !canManageSettings &&
    !canManageVoice &&
    !canManageQuotas
  ) {
    return null;
  }
  return (
    <Sidebar.Group>
      <Sidebar.GroupLabel className="h-4">AI / erxes Agent</Sidebar.GroupLabel>
      <Sidebar.GroupContent className="pt-1">
        <Sidebar.Menu>
          {/* "Agents" is not listed here: it lives in the main plugin nav
              (MastraNavigation) and a Settings copy was a confusing duplicate. */}
          {canReadSkills && (
            <SettingsNavigationMenuLinkItem
              pathPrefix="erxes-agent"
              path="/skills"
              name="Skills"
            />
          )}
          {canReadProviders && (
            <SettingsNavigationMenuLinkItem
              pathPrefix="erxes-agent"
              path="/providers"
              name="Providers & Models"
            />
          )}
          {(canReadSettingsStatus || canManageSettings) && (
            <SettingsNavigationMenuLinkItem
              pathPrefix="erxes-agent"
              path="/general"
              name="General Settings"
            />
          )}
          {canManageVoice && (
            <SettingsNavigationMenuLinkItem
              pathPrefix="erxes-agent"
              path="/voice"
              name="Voice (Chimege)"
            />
          )}
          {canManageQuotas && (
            <SettingsNavigationMenuLinkItem
              pathPrefix="erxes-agent"
              path="/user-quotas"
              name="User Quotas"
            />
          )}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};

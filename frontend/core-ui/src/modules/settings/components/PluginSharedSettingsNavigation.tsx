import { NavigationMenuLinkItem, Sidebar } from 'erxes-ui';
import {
  IconHierarchy2,
  IconNotification,
  IconTag,
} from '@tabler/icons-react';
import { useNotificationPluginsTypes } from '@/notification/settings/hooks/useNotificationPluginsTypes';

import { usePermissionCheck } from 'ui-modules';
import { usePropertyTypes } from '@/properties/hooks/usePropertyTypes';
import { useTagTypes } from 'ui-modules/modules/tags-new/hooks/useTagTypes';
import { useTranslation } from 'react-i18next';

export const PluginSharedSettingsNavigation = ({
  pluginName,
  pathPrefix,
}: {
  pluginName: string;
  pathPrefix: string;
}) => {
  const { t } = useTranslation('common');
  const { types } = useTagTypes();
  const { propertyTypes } = usePropertyTypes();
  const { pluginsNotifications } = useNotificationPluginsTypes();
  const { isLoaded, isWildcard, hasModulePermission } = usePermissionCheck();
  const canUse = (module: string) =>
    !isLoaded || isWildcard || hasModulePermission(module);
  const showTags = Boolean(types[pluginName]?.length) && canUse('tags');
  const showProperties =
    Boolean(propertyTypes[pluginName]?.length) && canUse('properties');
  const showNotifications = pluginsNotifications.some(
    (plugin) => plugin.pluginName === pluginName && plugin.modules?.length,
  );

  if (!showTags && !showProperties && !showNotifications) {
    return null;
  }

  return (
    <Sidebar.Group className="px-2 pt-0">
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {showTags && (
            <NavigationMenuLinkItem
              className="px-2"
              pathPrefix={pathPrefix}
              path="/tags"
              name={t('sidebar.tags')}
              icon={IconTag}
            />
          )}
          {showProperties && (
            <NavigationMenuLinkItem
              className="px-2"
              pathPrefix={pathPrefix}
              path="/properties"
              name={t('sidebar.properties', 'Properties')}
              icon={IconHierarchy2}
            />
          )}
          {showNotifications && (
            <NavigationMenuLinkItem
              className="px-2"
              pathPrefix={pathPrefix}
              path="/notifications"
              name={t('sidebar.notification')}
              icon={IconNotification}
            />
          )}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};

import { AppLayout, PagePanel } from 'erxes-ui';
import { DocumentsContextNavigation } from '@/documents/components/DocumentsContextNavigation';
import { INavigationActivity } from '@/navigation/types/NavigationActivity';
import { NavigationChildControlsProvider } from '@/navigation/components/app-sidebar/NavigationChildControlsProvider';
import { NavigationCorePanelContent } from '@/navigation/components/app-sidebar/NavigationCoreModules';
import { Outlet, useLocation } from 'react-router-dom';
import { SegmentsContextNavigation } from '@/segments/components/SegmentsSidebar';
import { SettingsSidebar } from '@/settings/components/SettingsSidebar';
import { AppPath } from '@/types/paths/AppPath';
import { SETTINGS_TAB_ID } from '@/navigation/hooks/useAppTabs';
import {
  findAppActivityByPath,
  isOrganizationSettingsPath,
} from '@/navigation/utils/navigationActivities';
import { useNavigationActivities } from '@/navigation/hooks/useNavigationActivities';
import { useTranslation } from 'react-i18next';

const getCoreModuleSidebar = (
  activity: INavigationActivity,
  pathname: string,
) => {
  if (pathname.startsWith(`/${AppPath.Segments}`)) {
    return <SegmentsContextNavigation />;
  }

  if (pathname.startsWith(`/${AppPath.Documents}`)) {
    return <DocumentsContextNavigation />;
  }

  if (activity.modules.some((module) => module.submenus?.length)) {
    return <NavigationCorePanelContent activity={activity} />;
  }

  return null;
};

/**
 * Plugin routes render bare: the plugin entry draws its own sidebar, pages
 * and settings. Core apps (organization settings, core modules) get their
 * sidebar from core.
 */
export const CoreAppOutlet = () => {
  const activities = useNavigationActivities();
  const { pathname } = useLocation();
  const { t } = useTranslation('common', { keyPrefix: 'navigation' });

  if (isOrganizationSettingsPath(pathname)) {
    return (
      <AppLayout
        id={SETTINGS_TAB_ID}
        title={t('organization-settings')}
        sidebar={<SettingsSidebar />}
      >
        <Outlet />
      </AppLayout>
    );
  }

  const activity = findAppActivityByPath(activities, pathname);

  const sidebar =
    activity?.kind === 'core' ? getCoreModuleSidebar(activity, pathname) : null;

  if (!activity || !sidebar) {
    return (
      <NavigationChildControlsProvider
        activity={activity?.kind === 'plugin' ? activity : undefined}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-2 has-[[data-app-layout]]:p-0">
          <PagePanel>
            <Outlet />
          </PagePanel>
        </div>
      </NavigationChildControlsProvider>
    );
  }

  return (
    <AppLayout
      id={activity.id}
      title={activity.label}
      sidebar={
        <NavigationChildControlsProvider activity={activity}>
          {sidebar}
        </NavigationChildControlsProvider>
      }
    >
      <Outlet />
    </AppLayout>
  );
};

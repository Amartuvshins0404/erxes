import { IconCarSuv } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAtom } from 'jotai';

import { activePluginState, cn, Sidebar } from 'erxes-ui';

const isCarsNavigationActive = (pathname: string) =>
  pathname === '/car' ||
  (pathname.startsWith('/car/') && !pathname.startsWith('/car/categories'));

const isCarRoute = (pathname: string) =>
  pathname === '/car' || pathname.startsWith('/car/');

let lastKnownPathname: string | undefined;

const CarsNavigationIcon = () => {
  const { pathname } = useLocation();
  const isActive = isCarsNavigationActive(pathname);

  return (
    <IconCarSuv
      className={cn('text-accent-foreground', isActive && 'text-primary')}
    />
  );
};

export const MainNavigation = () => {
  const { t } = useTranslation('car');
  const { pathname } = useLocation();
  const [activePlugin, setActivePlugin] = useAtom(activePluginState);
  const carsActive = isCarsNavigationActive(pathname);

  useEffect(() => {
    const previousPathname = lastKnownPathname || pathname;
    const previousWasCarRoute = isCarRoute(previousPathname);
    const currentIsCarRoute = isCarRoute(pathname);

    // Clear the persisted plugin sidebar only when the user actually leaves a
    // car route. The module-level previous path survives remounts that happen
    // when switching between federated plugin routes.
    if (activePlugin === 'car' && previousWasCarRoute && !currentIsCarRoute) {
      setActivePlugin(null);
    }

    lastKnownPathname = pathname;
  }, [activePlugin, pathname, setActivePlugin]);

  return (
    <Sidebar.MenuItem>
      <Sidebar.MenuButton asChild isActive={carsActive}>
        <Link to="/car">
          <CarsNavigationIcon />
          <span className="capitalize">
            {t('Cars', { defaultValue: 'Cars' })}
          </span>
        </Link>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  );
};

import { IconCarSuv } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { cn, Sidebar } from 'erxes-ui';

const isCarsNavigationActive = (pathname: string) =>
  pathname === '/car' ||
  (pathname.startsWith('/car/') && !pathname.startsWith('/car/categories'));

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
  const carsActive = isCarsNavigationActive(pathname);

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

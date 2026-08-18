import { IconCarSuv, IconFolders } from '@tabler/icons-react';
import { Sidebar } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const isCarsActive = (pathname: string) =>
  pathname === '/car' ||
  (pathname.startsWith('/car/') && !pathname.startsWith('/car/categories'));

const isCategoriesActive = (pathname: string) =>
  pathname === '/car/categories' || pathname.startsWith('/car/categories/');

export const CarSidebar = () => {
  const { t } = useTranslation('car');
  const { pathname } = useLocation();

  const items = [
    {
      label: t('Cars', { defaultValue: 'Cars' }),
      path: '/car',
      icon: IconCarSuv,
      isActive: isCarsActive(pathname),
    },
    {
      label: t('Categories', { defaultValue: 'Categories' }),
      path: '/car/categories',
      icon: IconFolders,
      isActive: isCategoriesActive(pathname),
    },
  ];

  return (
    <Sidebar collapsible="none" className="flex-none border-r">
      <Sidebar.Group>
        <Sidebar.GroupLabel>
          {t('Car modules', { defaultValue: 'Car modules' })}
        </Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {items.map(({ label, path, icon: Icon, isActive }) => (
              <Sidebar.MenuItem key={path}>
                <Sidebar.MenuButton isActive={isActive} asChild>
                  <Link to={path}>
                    <Icon />
                    {label}
                  </Link>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

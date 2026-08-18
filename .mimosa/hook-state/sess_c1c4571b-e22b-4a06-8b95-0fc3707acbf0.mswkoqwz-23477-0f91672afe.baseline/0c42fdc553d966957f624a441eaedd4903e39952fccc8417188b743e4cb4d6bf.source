import { Sidebar } from 'erxes-ui';
import { Link, useLocation } from 'react-router-dom';

export const BlockSettingsSidebar = () => {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="none" className="border-r flex-none">
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={pathname === '/settings/block'}
                asChild
              >
                <Link to="/settings/block">Developer Info</Link>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

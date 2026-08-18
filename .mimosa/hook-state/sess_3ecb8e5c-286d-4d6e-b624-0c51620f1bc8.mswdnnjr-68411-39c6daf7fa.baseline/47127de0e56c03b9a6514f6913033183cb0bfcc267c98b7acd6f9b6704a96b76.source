import { IconCalendarEvent } from '@tabler/icons-react';
import { Sidebar, cn } from 'erxes-ui';
import { Link, useLocation } from 'react-router-dom';

const isEventsActive = (pathname: string) =>
  pathname === '/event' || pathname.startsWith('/event/');

export const MainNavigation = () => {
  const { pathname } = useLocation();
  const active = isEventsActive(pathname);

  return (
    <Sidebar.MenuItem>
      <Sidebar.MenuButton asChild isActive={active}>
        <Link to="/event">
          <IconCalendarEvent
            className={cn('text-accent-foreground', active && 'text-primary')}
          />
          <span className="capitalize">Events</span>
        </Link>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  );
};

import { IconClipboardTextFilled, IconBriefcase } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { ToggleGroup } from 'erxes-ui';

const NAV_ITEMS = [
  {
    label: 'Agencies',
    path: '/blockadmin/agencies/agencies',
    icon: IconClipboardTextFilled,
  },
  {
    label: 'Listing',
    path: '/blockadmin/agencies/listing',
    icon: IconBriefcase,
  },
] as const;

export const AgenciesSubNav = () => {
  const { pathname } = useLocation();
  return (
    <ToggleGroup value={pathname} type="single">
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
        <ToggleGroup.Item value={path} asChild>
          <Link to={path}>
            <Icon className="size-4" />
            {label}
          </Link>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup>
  );
};

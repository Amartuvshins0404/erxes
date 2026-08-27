import { Separator, Sidebar, useQueryState } from 'erxes-ui';

import {
  PROFILE_OVERVIEW_TABS,
  PROFILE_PUBLIC_TABS,
  PROFILE_TABS,
  ProfileTab,
} from '../constants/profileTabs';

export const ProfileSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState<ProfileTab>('tab', {
    defaultValue: PROFILE_TABS.BASIC,
  });

  const renderGroup = (
    label: string,
    tabs: { value: ProfileTab; label: string }[],
  ) => (
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.GroupLabel>{label}</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {tabs.map((tab) => (
            <Sidebar.MenuItem key={tab.value}>
              <Sidebar.MenuButton
                isActive={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          ))}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:220px]"
    >
      {renderGroup('ПРОФАЙЛ', PROFILE_OVERVIEW_TABS)}
      <Separator />
      {renderGroup('НЭЭЛТТЭЙ МЭДЭЭЛЭЛ', PROFILE_PUBLIC_TABS)}
    </Sidebar>
  );
};

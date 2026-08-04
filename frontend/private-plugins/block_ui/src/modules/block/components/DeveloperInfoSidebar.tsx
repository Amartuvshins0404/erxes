import { DEVELOPER_INFO_TABS } from '@/block/constants/developerInfoTabs';
import { Separator, Sidebar, useQueryState } from 'erxes-ui';

export const DeveloperInfoSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState('activeTab', {
    defaultValue: DEVELOPER_INFO_TABS.GENERAL,
  });

  const overview = [DEVELOPER_INFO_TABS.GENERAL];
  const verification = [DEVELOPER_INFO_TABS.VERIFICATION];

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:200px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>OVERVIEW</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {overview.map((tab) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
      <Separator />
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>VERIFICATION</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {verification.map((tab) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

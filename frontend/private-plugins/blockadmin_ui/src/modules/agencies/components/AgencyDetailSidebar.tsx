import { Separator, Sidebar, useQueryState } from 'erxes-ui';
import {
  AGENCY_DETAIL_TABS,
  AGENCY_OVERVIEW_TABS,
  AGENCY_SETTINGS_TABS,
  AgencyDetailTab,
} from '../constants/agency-detail';

export const AgencyDetailSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState<AgencyDetailTab>('tab', {
    defaultValue: AGENCY_DETAIL_TABS.GENERAL,
  });

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:200px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>AGENCY OVERVIEW</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {AGENCY_OVERVIEW_TABS.map((tab) => (
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
      <Separator />
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>Internal settings</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {AGENCY_SETTINGS_TABS.map((tab) => (
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
    </Sidebar>
  );
};

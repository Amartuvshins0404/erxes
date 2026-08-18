import { Sidebar, useQueryState } from 'erxes-ui';
import { AGENCY_TABS } from '../constants/sidebar';

export const AgencyProfileSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState('activeTab', {
    defaultValue: 'general',
  });
  const properties = [
    AGENCY_TABS.GENERAL,
    AGENCY_TABS.IDENTITY,
    AGENCY_TABS.INTRODUCTION,
    AGENCY_TABS.DOCUMENTS,
    AGENCY_TABS.FIELD_OF_ACTIVITY,
    AGENCY_TABS.OPERATION_AREA,
    AGENCY_TABS.CONTACT,
    AGENCY_TABS.SOCIAL_LINKS,
  ];
  const settings = [AGENCY_TABS.MEMBERS, AGENCY_TABS.INTEGRATIONS];

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:200px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>AGENCY OVERVIEW</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {properties.map((tab) => (
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
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>Settings</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {settings.map((tab) => (
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

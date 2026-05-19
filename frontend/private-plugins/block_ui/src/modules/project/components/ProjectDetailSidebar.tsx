import { PROJECT_TABS } from '@/project/constants/project';
import { Separator, Sidebar, useQueryState } from 'erxes-ui';

export const ProjectDetailSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState('activeTab', {
    defaultValue: 'general',
  });
  const properties = [
    PROJECT_TABS.GENERAL,
    PROJECT_TABS.PRICING,
    PROJECT_TABS.AMENITIES,

    PROJECT_TABS.SPECIFICATIONS,
    PROJECT_TABS.TARGET,
    PROJECT_TABS.CONTACT,
    PROJECT_TABS.MEDIA,
    PROJECT_TABS.DOCUMENTS,
    PROJECT_TABS.UNIT_TYPES,
  ];

  const stacking = [
    PROJECT_TABS.BUILDINGS,
    PROJECT_TABS.ZONES,
    PROJECT_TABS.UNITS,
  ];

  const settings = [
    PROJECT_TABS.MEMBERS,
    PROJECT_TABS.INSIDER,
    PROJECT_TABS.OPPTY_STATUSES,
    PROJECT_TABS.CONTRACT_STATUSES,
  ];

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:200px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>PROJECT OVERVIEW</Sidebar.GroupLabel>
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
      <Separator />
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>Stacking plan</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {stacking.map((tab) => (
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
          <Sidebar.GroupLabel>Internal Settings</Sidebar.GroupLabel>
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

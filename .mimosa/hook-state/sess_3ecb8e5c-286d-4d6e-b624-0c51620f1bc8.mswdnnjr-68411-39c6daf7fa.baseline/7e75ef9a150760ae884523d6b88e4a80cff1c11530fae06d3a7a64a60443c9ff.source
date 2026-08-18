import { Sidebar, useQueryState } from 'erxes-ui';
import { UNIT_DOCUMENT_TABS } from '@/unit/constants/unit';

export const UnitSidebar = () => {
  const [activeUnitTab, setActiveUnitTab] = useQueryState('activeUnitTab', {
    defaultValue: 'overview',
  });

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:200px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>General</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {Object.entries(UNIT_DOCUMENT_TABS).map(([tab, value]) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={activeUnitTab === tab}
                  onClick={() => setActiveUnitTab(tab)}
                  className="capitalize"
                >
                  {value.mn}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

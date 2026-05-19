import { UNIT_DOCUMENT_TABS } from '@/unit/constants/unit';
import { Sidebar, useQueryState } from 'erxes-ui';

export const UnitSidebar = () => {
  const [activeUnitTab, setActiveUnitTab] = useQueryState('activeUnitTab', {
    defaultValue: 'overview',
  });

  return (
    <Sidebar
      collapsible="none"
      className="flex-none border-r w-64"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {Object.entries(UNIT_DOCUMENT_TABS).map(([tab, value]) => (
              <Sidebar.MenuItem key={tab}>
                <Sidebar.MenuButton
                  isActive={activeUnitTab === tab}
                  onClick={() => setActiveUnitTab(tab)}
                  className="capitalize"
                >
                  {value?.en}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

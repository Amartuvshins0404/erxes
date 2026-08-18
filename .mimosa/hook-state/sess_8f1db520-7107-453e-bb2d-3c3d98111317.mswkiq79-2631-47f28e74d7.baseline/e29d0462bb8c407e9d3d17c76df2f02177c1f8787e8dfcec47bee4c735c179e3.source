import { Sidebar, useQueryState } from 'erxes-ui';

const LISTING_TABS = [
  'general',
  'location',
  'pricing',
  'specs',
  'media',
] as const;

export type ListingTab = (typeof LISTING_TABS)[number];

export const AdminListingDetailSidebar = () => {
  const [activeTab, setActiveTab] = useQueryState<ListingTab>('tab', {
    defaultValue: 'general',
  });

  return (
    <Sidebar
      collapsible="none"
      className="border-r flex-none [--sidebar-width:180px]"
    >
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.GroupLabel>LISTING</Sidebar.GroupLabel>
          <Sidebar.Menu>
            {LISTING_TABS.map((tab) => (
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

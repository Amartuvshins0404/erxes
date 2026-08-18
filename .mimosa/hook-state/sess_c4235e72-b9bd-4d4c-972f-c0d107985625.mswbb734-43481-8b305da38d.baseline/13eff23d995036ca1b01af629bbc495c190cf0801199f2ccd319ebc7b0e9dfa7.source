import { PageSubHeader, ScrollArea, Tabs } from 'erxes-ui';
import { ReactNode, useState } from 'react';
import { OneFitPageLayout } from './OneFitPageLayout';

interface TabConfig<TFilters = any> {
  value: string;
  label: string;
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
  filtersComponent: React.ComponentType<{
    filters: TFilters;
    onFiltersChange: (filters: TFilters) => void;
  }>;
  listComponent: React.ComponentType<{ filters: TFilters }>;
  createDialog?: ReactNode;
  headerActions?: ReactNode;
  emptyState?: ReactNode;
}

interface OneFitTabbedListPageLayoutProps {
  pageName: string;
  pageIcon?: ReactNode;
  defaultTab?: string;
  tabs: TabConfig[];
}

export function OneFitTabbedListPageLayout({
  pageName,
  pageIcon,
  defaultTab,
  tabs,
}: OneFitTabbedListPageLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  const activeTabConfig = tabs.find((tab) => tab.value === activeTab);

  return (
    <OneFitPageLayout pageName={pageName} pageIcon={pageIcon}>
      <div className="flex flex-auto overflow-hidden flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-auto overflow-hidden"
        >
          <Tabs.List className="mx-4 mt-4">
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Content
              key={tab.value}
              value={tab.value}
              className="flex flex-col flex-auto overflow-hidden"
            >
              <PageSubHeader>
                <div className="flex items-center gap-2">
                  <tab.filtersComponent
                    filters={tab.filters}
                    onFiltersChange={tab.onFiltersChange}
                  />
                  {tab.createDialog}
                  {tab.headerActions}
                </div>
              </PageSubHeader>
              <ScrollArea className="flex-auto">
                {tab.emptyState ? (
                  tab.emptyState
                ) : (
                  <tab.listComponent filters={tab.filters} />
                )}
              </ScrollArea>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    </OneFitPageLayout>
  );
}

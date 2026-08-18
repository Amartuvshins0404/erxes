import { PageSubHeader, ScrollArea } from 'erxes-ui';
import { ReactNode } from 'react';
import { OneFitPageLayout } from './OneFitPageLayout';

interface OneFitListPageLayoutProps<TFilters> {
  pageName: string;
  pageIcon?: ReactNode;
  filters: TFilters;
  onFiltersChange: (filters: TFilters) => void;
  filtersComponent: React.ComponentType<{
    filters: TFilters;
    onFiltersChange: (filters: TFilters) => void;
  }>;
  createDialog?: ReactNode;
  createDialogInHeader?: boolean;
  listComponent: React.ComponentType<{
    filters: TFilters;
    onFiltersChange?: (filters: TFilters) => void;
  }>;
  headerActions?: ReactNode;
}

export function OneFitListPageLayout<TFilters>({
  pageName,
  pageIcon,
  filters,
  onFiltersChange,
  filtersComponent: FiltersComponent,
  createDialog,
  createDialogInHeader = false,
  listComponent: ListComponent,
  headerActions,
}: OneFitListPageLayoutProps<TFilters>) {
  return (
    <OneFitPageLayout
      pageName={pageName}
      pageIcon={pageIcon}
      headerActions={
        <>
          {createDialogInHeader && createDialog}
          {headerActions}
        </>
      }
    >
      {/* <div className="flex flex-auto overflow-hidden flex-col"> */}
      <PageSubHeader>
        <div className="flex items-center gap-2">
          <FiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
          {!createDialogInHeader && createDialog}
        </div>
      </PageSubHeader>
      {/* <ScrollArea className="flex-auto"> */}
      <ListComponent filters={filters} onFiltersChange={onFiltersChange} />
      {/* </ScrollArea> */}
      {/* </div> */}
    </OneFitPageLayout>
  );
}

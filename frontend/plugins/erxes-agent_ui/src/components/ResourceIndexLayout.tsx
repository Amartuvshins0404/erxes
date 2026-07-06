import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconPlus } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Breadcrumb,
  Button,
  Empty,
  RecordTable,
  Separator,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { GroupByConfig, GroupedRowList } from './GroupedRowList';

interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface ResourceIndexLayoutProps<T> {
  icon: Icon;
  title: string;
  rootPath: string;
  sessionKey: string;
  columns: ColumnDef<T>[];
  data: T[];
  loading: boolean;
  stickyColumns?: string[];
  skeletonRows?: number;
  pageInfo?: PageInfo;
  onFetchMore?: () => void;
  /** When set, rows render in collapsible sections instead of a flat list. */
  groupBy?: GroupByConfig<T>;
  newButton?: { to: string; label: string };
  empty: {
    icon?: Icon;
    title: string;
    description: ReactNode;
    action: ReactNode;
    className?: string;
  };
  headerExtra?: ReactNode;
  /** Rendered inside RecordTable.Provider — use for CommandBar or other table-context consumers. */
  commandBar?: ReactNode;
  /**
   * Render inside a host page (e.g. the per-agent detail tabs) that already
   * supplies its own breadcrumb/header. Drops the full PageHeader and shows only
   * a compact action row (headerExtra + new-button) so the two headers don't
   * stack.
   */
  embedded?: boolean;
}

// Shared shell for the plugin's resource index pages (agents, schedules,
// workflows, learnings): breadcrumb header with an optional new-button / extras,
// an empty-state, and the record table with its loading-skeleton switch.
export const ResourceIndexLayout = <T,>({
  icon: Icon,
  title,
  rootPath,
  sessionKey,
  columns,
  data,
  loading,
  stickyColumns = ['more', 'checkbox', 'name'],
  skeletonRows = 10,
  pageInfo,
  onFetchMore,
  groupBy,
  newButton,
  empty,
  headerExtra,
  commandBar,
  embedded,
}: ResourceIndexLayoutProps<T>) => {
  const EmptyIcon = empty.icon ?? Icon;

  const actions = (
    <>
      {headerExtra}
      {newButton && (
        <Button asChild>
          <Link to={newButton.to}>
            <IconPlus /> {newButton.label}
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {embedded ? (
        (headerExtra || newButton) && (
          <div className="flex items-center justify-end gap-2 px-3 pt-3">
            {actions}
          </div>
        )
      ) : (
        <PageHeader>
          <PageHeader.Start>
            <Breadcrumb>
              <Breadcrumb.List className="gap-1">
                <Breadcrumb.Item>
                  <Button variant="ghost" asChild>
                    <Link to={rootPath}>
                      <Icon />
                      {title}
                    </Link>
                  </Button>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb>
            <Separator.Inline />
            <PageHeader.FavoriteToggleButton />
          </PageHeader.Start>
          <PageHeader.End>{actions}</PageHeader.End>
        </PageHeader>
      )}

      {!loading && data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Empty
            className={`border border-dashed w-full ${empty.className ?? 'max-w-sm'}`}
          >
            <Empty.Header>
              <Empty.Media variant="icon">
                <EmptyIcon />
              </Empty.Media>
              <Empty.Title>{empty.title}</Empty.Title>
              <Empty.Description>{empty.description}</Empty.Description>
            </Empty.Header>
            <Empty.Content>{empty.action}</Empty.Content>
          </Empty>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <RecordTable.Provider
            columns={columns}
            data={data}
            className="m-3"
            stickyColumns={stickyColumns}
          >
            <RecordTable.CursorProvider
              hasPreviousPage={pageInfo?.hasPreviousPage ?? false}
              hasNextPage={pageInfo?.hasNextPage ?? false}
              loading={loading}
              dataLength={data.length}
              sessionKey={sessionKey}
            >
              <RecordTable.Scroll>
                <RecordTable>
                  <RecordTable.Header />
                  <RecordTable.Body>
                    {onFetchMore && (
                      <RecordTable.CursorBackwardSkeleton
                        handleFetchMore={onFetchMore}
                      />
                    )}
                    {loading && data.length === 0 ? (
                      <RecordTable.RowSkeleton rows={skeletonRows} />
                    ) : groupBy ? (
                      <GroupedRowList<T> groupBy={groupBy} />
                    ) : (
                      <RecordTable.RowList />
                    )}
                    {onFetchMore && (
                      <RecordTable.CursorForwardSkeleton
                        handleFetchMore={onFetchMore}
                      />
                    )}
                  </RecordTable.Body>
                </RecordTable>
              </RecordTable.Scroll>
            </RecordTable.CursorProvider>
            {commandBar}
          </RecordTable.Provider>
        </div>
      )}
    </div>
  );
};

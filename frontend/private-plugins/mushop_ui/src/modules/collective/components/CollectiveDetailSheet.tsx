import {
  Badge,
  Button,
  Command,
  FocusSheet,
  InfoCard,
  Popover,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Table,
  Tabs,
  toast,
  Tooltip,
  useQueryState,
} from 'erxes-ui';
import { IconPlus, IconRefresh, IconX } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionCheck } from 'ui-modules';
import { useCollectiveDetail } from '../hooks/useCollectiveDetail';
import { useResyncCollective } from '../hooks/useResyncCollective';
import { useUpdateCollectiveSuppliers } from '../hooks/useUpdateCollectiveSuppliers';
import { useSuppliers } from '../../supplier/hooks/useSuppliers';
import { humanizeSyncError } from '../utils/humanizeSyncError';
import {
  ICollective,
  ICollectiveSupplier,
  ICollectiveSyncResult,
} from '../types';

const MIN_COLLECTIVE_SUPPLIERS = 2;

const statusVariant = (status?: string) => {
  if (status === 'active') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  if (status === 'syncing') return 'info' as const;
  return 'secondary' as const;
};

const verificationVariant = (status?: string) => {
  if (status === 'verified') return 'success' as const;
  if (status === 'unverified') return 'destructive' as const;
  return 'secondary' as const;
};

const Row = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
}) => (
  <Table.Row>
    <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
      {label}
    </Table.Cell>
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal">
      {value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

const SupplierLine = ({
  supplier,
  fallbackId,
  onRemove,
  removable,
  disabled,
}: {
  supplier?: ICollectiveSupplier | null;
  fallbackId: string;
  onRemove?: () => void;
  removable?: boolean;
  disabled?: boolean;
}) => {
  const { t } = useTranslation('mushop');
  return (
    <Table.Row>
      <Table.Cell className="bg-sidebar p-2 w-40 h-auto max-h-10 text-muted-foreground">
        {supplier?.name || fallbackId}
      </Table.Cell>
      <Table.Cell className="p-1 pl-2 h-auto min-h-10 whitespace-normal">
        <div className="flex justify-between items-center gap-2">
          <Badge variant={verificationVariant(supplier?.verificationStatus)}>
            {supplier?.verificationStatus || t('unknown')}
          </Badge>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="size-4 cursor-pointer"
              disabled={disabled || !removable}
              onClick={onRemove}
              title={
                removable
                  ? t('Remove supplier')
                  : t('At least {{count}} suppliers are required', {
                      count: MIN_COLLECTIVE_SUPPLIERS,
                    })
              }
            >
              <IconX className="size-4" />
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

const AddSupplierPopover = ({
  currentIds,
  onAdd,
  disabled,
}: {
  currentIds: string[];
  onAdd: (supplierId: string) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const { suppliers = [], loading } = useSuppliers();

  const currentSet = useMemo(() => new Set(currentIds), [currentIds]);
  const available = useMemo(
    () => (suppliers || []).filter((s: any) => !currentSet.has(s._id)),
    [suppliers, currentSet],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={disabled}
        >
          <IconPlus className="size-4" />
        </Button>
      </Popover.Trigger>

      <Popover.Content align="end" className="p-0 w-64">
        <Command>
          <Command.Input placeholder={t('Search suppliers...')} />
          <Command.List>
            {loading && (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            )}
            {!loading && available.length === 0 && (
              <div className="p-3 text-muted-foreground text-sm text-center">
                {t('No suppliers available')}
              </div>
            )}
            {!loading &&
              available.map((s: any) => (
                <Command.Item
                  key={s._id}
                  value={`${s.name || ''} ${s._id}`}
                  onSelect={() => {
                    setOpen(false);
                    onAdd(s._id);
                  }}
                >
                  {s.name || s._id}
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover>
  );
};

const CollectiveOverview = ({ collective }: { collective: ICollective }) => {
  const {
    _id,
    name,
    description,
    targetSubdomain,
    supplierIds = [],
    suppliers = [],
    status,
    totalCreated,
    totalFailed,
    lastSyncedAt,
    createdAt,
    updatedAt,
    createdBy,
  } = collective;

  const { t } = useTranslation('mushop');
  const { updateSuppliers, loading: savingSuppliers } =
    useUpdateCollectiveSuppliers(_id);
  const { hasActionPermission } = usePermissionCheck();
  const canManageSuppliers = hasActionPermission(
    'mushopUpdateCollectiveSuppliers',
  );

  const applySupplierIds = async (nextIds: string[]) => {
    try {
      await updateSuppliers({ variables: { _id, supplierIds: nextIds } });
      toast({ variant: 'success', title: t('Suppliers updated') });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('Failed to update suppliers'),
        description: e?.message,
      });
    }
  };

  const handleRemove = (supplierId: string) => {
    const next = supplierIds.filter((id) => id !== supplierId);
    applySupplierIds(next);
  };

  const handleAdd = (supplierId: string) => {
    if (supplierIds.includes(supplierId)) return;
    applySupplierIds([...supplierIds, supplierId]);
  };

  const removable =
    canManageSuppliers && supplierIds.length > MIN_COLLECTIVE_SUPPLIERS;

  return (
    <div className="flex flex-col gap-4 p-4">
      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row label={t('Name')} value={name} />
              <Row label={t('Description')} value={description} />
              <Row label={t('Target subdomain')} value={targetSubdomain} />
              <Row label={t('Suppliers')} value={supplierIds.length} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                  {t('Status')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                  <Badge variant={statusVariant(status)}>
                    {status || t('pending')}
                  </Badge>
                </Table.Cell>
              </Table.Row>
              <Row label={t('Created products')} value={totalCreated ?? 0} />
              <Row label={t('Failed products')} value={totalFailed ?? 0} />
              <Row
                label={t('Last sync')}
                value={
                  lastSyncedAt
                    ? new Date(lastSyncedAt).toLocaleString()
                    : undefined
                }
              />
              <Row label={t('Created by')} value={createdBy} />
              <Row
                label={t('Created')}
                value={
                  createdAt
                    ? new Date(createdAt).toLocaleDateString()
                    : undefined
                }
              />
              <Row
                label={t('Updated')}
                value={
                  updatedAt
                    ? new Date(updatedAt).toLocaleDateString()
                    : undefined
                }
              />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <div className="flex flex-col bg-foreground/5 rounded-xl p-1 pt-0">
        <div className="flex justify-between items-center pr-1 pl-2 h-7">
          <h3 className="font-medium font-mono text-xs uppercase">
            {t('Suppliers')}
          </h3>
          {canManageSuppliers && (
            <AddSupplierPopover
              currentIds={supplierIds}
              onAdd={handleAdd}
              disabled={savingSuppliers}
            />
          )}
        </div>
        <div className="flex flex-col flex-auto gap-3 bg-background shadow-sm p-0 rounded-lg overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              {supplierIds.map((id) => {
                const supplier =
                  suppliers.find((s) => s._id === id) || undefined;
                return (
                  <SupplierLine
                    key={id}
                    supplier={supplier}
                    fallbackId={id}
                    removable={removable}
                    disabled={savingSuppliers}
                    onRemove={() => handleRemove(id)}
                  />
                );
              })}
            </Table.Body>
          </Table>
        </div>
      </div>
    </div>
  );
};

const ErrorList = ({ errors }: { errors: string[] }) => {
  const { t } = useTranslation('mushop');
  const grouped = errors.map(humanizeSyncError);
  const buckets = new Map<
    string,
    { reason: string; codes: string[]; raws: string[] }
  >();
  for (const e of grouped) {
    const bucket = buckets.get(e.reason) ?? {
      reason: e.reason,
      codes: [],
      raws: [],
    };
    if (e.productCode) bucket.codes.push(e.productCode);
    bucket.raws.push(e.raw);
    buckets.set(e.reason, bucket);
  }

  return (
    <ul className="space-y-2 text-xs">
      {Array.from(buckets.values()).map((b, i) => (
        <li key={i} className="space-y-1">
          <div className="font-medium">{b.reason}</div>
          {b.codes.length > 0 && (
            <div className="text-muted-foreground" title={b.raws.join('\n')}>
              {t('Affected products:')} {b.codes.slice(0, 8).join(', ')}
              {b.codes.length > 8 &&
                ` ${t('(+{{count}} more)', { count: b.codes.length - 8 })}`}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const SyncResultCard = ({
  result,
  collectiveId,
  canResync,
}: {
  result: ICollectiveSyncResult;
  collectiveId: string;
  canResync: boolean;
}) => {
  const {
    supplierId,
    supplier,
    subdomain,
    total,
    created,
    failed,
    errors = [],
  } = result;
  const { t } = useTranslation('mushop');
  const title = supplier?.name || subdomain || supplierId;
  const { resyncCollective, loading } = useResyncCollective(collectiveId);

  const handleResync = async () => {
    try {
      await resyncCollective({
        variables: { _id: collectiveId, supplierIds: [supplierId] },
      });
      toast({
        variant: 'success',
        title: t('Resync started for {{name}}', { name: title }),
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('Failed to resync supplier'),
        description: e?.message,
      });
    }
  };

  return (
    <div className="flex flex-col bg-foreground/5 rounded-xl p-1 pt-0">
      <div className="flex justify-between items-center pr-1 pl-2 h-7 shrink-0">
        <h3 className="font-medium font-mono text-xs uppercase truncate">
          {title}
        </h3>
        {canResync && (
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={loading}
                  onClick={handleResync}
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <IconRefresh className="size-4" />
                  )}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>{t('Resync this supplier')}</Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        )}
      </div>
      <InfoCard.Content className="shadow-none p-0 overflow-hidden">
        <Table>
          <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
            <SupplierLine supplier={supplier} fallbackId={supplierId} />
            {subdomain && <Row label={t('Subdomain')} value={subdomain} />}
            <Table.Row>
              <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                {t('Total')}
              </Table.Cell>
              <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                <Badge variant="default">{total ?? 0}</Badge>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                {t('Created')}
              </Table.Cell>
              <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                <Badge variant="success">{created ?? 0}</Badge>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                {t('Failed')}
              </Table.Cell>
              <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                {(failed ?? 0) > 0 ? (
                  <Badge variant="destructive">{failed}</Badge>
                ) : (
                  <Badge variant="secondary">0</Badge>
                )}
              </Table.Cell>
            </Table.Row>
            {errors.length > 0 && (
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 text-muted-foreground align-top">
                  {t('What went wrong')}
                </Table.Cell>
                <Table.Cell className="p-2 whitespace-normal">
                  <ErrorList errors={errors} />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </InfoCard.Content>
    </div>
  );
};

const CollectiveSyncResults = ({ collective }: { collective: ICollective }) => {
  const { t } = useTranslation('mushop');
  const results = collective.syncResults || [];
  const { hasActionPermission } = usePermissionCheck();
  const canResync = hasActionPermission('mushopResyncCollective');
  const { resyncCollective, loading: resyncingAll } = useResyncCollective(
    collective._id,
  );
  const isSyncing = collective.status === 'syncing';

  const handleResyncAll = async () => {
    try {
      await resyncCollective({ variables: { _id: collective._id } });
      toast({ variant: 'success', title: t('Resync started') });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('Failed to resync'),
        description: e?.message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {results.length === 0 ? (
        <div className="text-muted-foreground">{t('No sync results yet.')}</div>
      ) : (
        results.map((r) => (
          <SyncResultCard
            key={r.supplierId}
            result={r}
            collectiveId={collective._id}
            canResync={canResync && !isSyncing}
          />
        ))
      )}
    </div>
  );
};

const TABS = ['overview', 'sync'] as const;
type Tab = (typeof TABS)[number];

const tabLabel: Record<Tab, string> = {
  overview: 'Overview',
  sync: 'Sync results',
};

export const CollectiveDetailSheet = () => {
  const { t } = useTranslation('mushop');
  const [activeCollectiveId, setActiveCollectiveId] =
    useQueryState<string>('activeCollectiveId');
  const [tab, setTab] = useQueryState<string>('collectiveTab');
  const { collective, loading } = useCollectiveDetail(activeCollectiveId);

  const activeTab = (tab ?? 'overview') as Tab;

  return (
    <FocusSheet
      open={!!activeCollectiveId}
      onOpenChange={() => setActiveCollectiveId(null)}
    >
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header
          title={collective?.name || t('Collective Detail')}
        />
        <FocusSheet.Content className="flex flex-row flex-auto min-h-0 overflow-hidden">
          <FocusSheet.SideBar>
            <Sidebar.Content>
              <Sidebar.Group>
                <Sidebar.GroupContent className="mt-2">
                  <Sidebar.Menu>
                    {TABS.map((tabKey) => (
                      <Sidebar.MenuItem key={tabKey}>
                        <Sidebar.MenuButton
                          isActive={activeTab === tabKey}
                          onClick={() => setTab(tabKey)}
                        >
                          {t(tabLabel[tabKey])}
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    ))}
                  </Sidebar.Menu>
                </Sidebar.GroupContent>
              </Sidebar.Group>
            </Sidebar.Content>
          </FocusSheet.SideBar>

          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setTab}
              className="flex flex-col flex-1 min-h-0"
            >
              <Tabs.Content
                value="overview"
                className="data-[state=active]:flex flex-col flex-1 min-h-0"
              >
                <ScrollArea className="flex-1 min-h-0">
                  {loading && (
                    <div className="p-4">
                      <Spinner />
                    </div>
                  )}
                  {!loading && collective && (
                    <CollectiveOverview collective={collective} />
                  )}
                  {!loading && !collective && (
                    <div className="p-4">{t('Collective not found')}</div>
                  )}
                </ScrollArea>
              </Tabs.Content>

              <Tabs.Content
                value="sync"
                className="data-[state=active]:flex flex-col flex-1 min-h-0"
              >
                <ScrollArea className="flex-1 min-h-0">
                  {loading && (
                    <div className="p-4">
                      <Spinner />
                    </div>
                  )}
                  {!loading && collective && (
                    <CollectiveSyncResults collective={collective} />
                  )}
                </ScrollArea>
              </Tabs.Content>
            </Tabs>

            <Sheet.Footer className="flex-none border-t">
              <Sheet.Close asChild>
                <Button variant="secondary" className="bg-border">
                  {t('Close')}
                </Button>
              </Sheet.Close>
            </Sheet.Footer>
          </div>
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};

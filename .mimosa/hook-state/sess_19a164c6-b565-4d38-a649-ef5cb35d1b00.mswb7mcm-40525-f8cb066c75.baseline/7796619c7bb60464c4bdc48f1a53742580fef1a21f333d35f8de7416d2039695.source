import {
  Avatar,
  Badge,
  Button,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Table,
  Tabs,
  useQueryState,
} from 'erxes-ui';
import { IconBuildingStore } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { IOrder, IOrderItemPayload } from '../types';
import { OrderErrorText } from './OrderErrorText';
import { OrderRawPayload } from './OrderRawPayload';
import { OrderResyncButton } from './OrderResyncButton';

const statusVariant = (status?: string) => {
  if (status === 'forwarded') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  if (status === 'cancelled') return 'secondary' as const;
  return 'warning' as const;
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
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal break-all">
      {value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

const OrderItemsTable = ({ items }: { items: IOrderItemPayload[] }) => {
  const { t } = useTranslation('mushop');
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t('Product')}</Table.Head>
          <Table.Head>{t('Qty')}</Table.Head>
          <Table.Head>{t('Unit price')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item, index) => (
          <Table.Row key={`${item.productId || index}`}>
            <Table.Cell className="p-2">
              {item.productName || (
                <span className="text-muted-foreground" title={t('Product not found')}>
                  {item.productId || '-'}
                </span>
              )}
            </Table.Cell>
            <Table.Cell className="p-2">{item.count ?? '-'}</Table.Cell>
            <Table.Cell className="p-2">
              {typeof item.unitPrice === 'number'
                ? item.unitPrice.toLocaleString()
                : '-'}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};

const OrderOverview = ({ order }: { order: IOrder }) => {
  const { t } = useTranslation('mushop');
  const {
    _id,
    entityId,
    status,
    error,
    supplier,
    customer,
    createdAt,
    updatedAt,
  } = order;

  const customerName = [customer?.firstName, customer?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-4 p-4">
      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row label={t('Order ID')} value={entityId} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                  {t('Status')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10">
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariant(status)}>
                      {status || 'pending'}
                    </Badge>
                    <OrderResyncButton orderId={_id} status={status} />
                  </div>
                </Table.Cell>
              </Table.Row>
              {error && (
                <Row label={t('Error')} value={<OrderErrorText error={error} />} />
              )}
              <Row
                label={t('Created')}
                value={createdAt ? new Date(createdAt).toLocaleString() : undefined}
              />
              <Row
                label={t('Updated')}
                value={updatedAt ? new Date(updatedAt).toLocaleString() : undefined}
              />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Supplier')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          {supplier ? (
            <div className="flex items-center gap-2 p-2">
              <Avatar size="lg">
                {supplier.logo ? (
                  <Avatar.Image src={supplier.logo} />
                ) : (
                  <Avatar.Fallback>
                    <IconBuildingStore className="size-3" />
                  </Avatar.Fallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{supplier.name}</span>
                {supplier.code && (
                  <span className="text-muted-foreground text-xs">
                    {supplier.code}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 text-muted-foreground">{t('Unknown supplier')}</div>
          )}
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Customer')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          {customer ? (
            <Table>
              <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                <Row label={t('Name')} value={customerName || undefined} />
                <Row label={t('Phone')} value={customer?.primaryPhone} />
                <Row label={t('Email')} value={customer?.primaryEmail} />
              </Table.Body>
            </Table>
          ) : (
            <div className="p-2 text-muted-foreground">{t('Unknown customer')}</div>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

const OrderPayload = ({ order }: { order: IOrder }) => {
  const { t } = useTranslation('mushop');
  const payload = order.order;

  if (!payload) {
    return (
      <div className="p-4 text-muted-foreground">{t('No payload data')}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {!!payload.items?.length && (
        <InfoCard title={t('Items')}>
          <InfoCard.Content className="shadow-none p-0 overflow-hidden">
            <OrderItemsTable items={payload.items} />
          </InfoCard.Content>
        </InfoCard>
      )}

      {(payload.totalAmount != null || payload.finalAmount != null) && (
        <InfoCard title={t('Amounts')}>
          <InfoCard.Content className="shadow-none p-0 overflow-hidden">
            <Table>
              <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                {payload.totalAmount != null && (
                  <Row
                    label={t('Total amount')}
                    value={payload.totalAmount.toLocaleString()}
                  />
                )}
                {payload.finalAmount != null && (
                  <Row
                    label={t('Final amount')}
                    value={payload.finalAmount.toLocaleString()}
                  />
                )}
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>
      )}

      <InfoCard title={t('Raw payload')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <OrderRawPayload payload={payload} />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

const TABS = ['overview', 'payload'] as const;

const OrderDetail = ({ order }: { order: IOrder }) => {
  const { t } = useTranslation('mushop');
  const [tab, setTab] = useQueryState<string>('orderTab');
  const activeTab = tab ?? 'overview';

  return (
    <div className="flex flex-row flex-auto min-h-0 overflow-hidden">
      <FocusSheet.SideBar>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent className="mt-2">
              <Sidebar.Menu>
                {TABS.map((tabName) => (
                  <Sidebar.MenuItem key={tabName}>
                    <Sidebar.MenuButton
                      isActive={activeTab === tabName}
                      onClick={() => setTab(tabName)}
                    >
                      {t(tabName.charAt(0).toUpperCase() + tabName.slice(1))}
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
              <OrderOverview order={order} />
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content
            value="payload"
            className="data-[state=active]:flex flex-col flex-1 min-h-0"
          >
            <ScrollArea className="flex-1 min-h-0">
              <OrderPayload order={order} />
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
    </div>
  );
};

export const OrderDetailSheet = () => {
  const { t } = useTranslation('mushop');
  const [activeOrderId, setActiveOrderId] = useQueryState<string>('activeOrderId');
  const { order, loading } = useOrderDetail(activeOrderId);

  return (
    <FocusSheet
      open={!!activeOrderId}
      onOpenChange={() => setActiveOrderId(null)}
    >
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header title={order?.entityId || t('Order Detail')} />
        <FocusSheet.Content className="flex flex-row flex-auto min-h-0 overflow-hidden">
          {loading && (
            <div className="flex flex-1 justify-center items-center p-4">
              <Spinner />
            </div>
          )}
          {!loading && order && <OrderDetail order={order} />}
          {!loading && !order && (
            <div className="p-4">{t('Order not found')}</div>
          )}
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};

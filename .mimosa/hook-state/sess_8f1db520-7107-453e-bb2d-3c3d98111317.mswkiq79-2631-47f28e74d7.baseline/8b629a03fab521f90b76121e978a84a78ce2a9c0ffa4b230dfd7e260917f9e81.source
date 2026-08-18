import {
  IconBuildingStore,
  IconCalendarPlus,
  IconProgress,
  IconReceipt,
} from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectSupplier } from '@/supplier/components/select/SelectSupplier';
import { SelectOrderStatus } from './SelectOrderStatus';

const OrdersFilterPopover = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    status: string;
    supplierId: string;
    entityId: string;
    created: string;
  }>(['status', 'supplierId', 'entityId', 'created']);

  const hasFilters = Object.values(queries || {}).some((v) => v !== null);

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder={t('Filter')}
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="entityId" inDialog>
                  <IconReceipt />
                  {t('Order ID')}
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgress />
                  {t('Status')}
                </Filter.Item>
                <Filter.Item value="supplierId">
                  <IconBuildingStore />
                  {t('Supplier')}
                </Filter.Item>
                <Filter.Item value="created">
                  <IconCalendarPlus />
                  {t('Created At')}
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="created">
            <Filter.DateView filterKey="created" />
          </Filter.View>
          <SelectOrderStatus.FilterView queryKey="status" />
          <SelectSupplier.FilterView queryKey="supplierId" />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="entityId" inDialog>
          <Filter.DialogStringView filterKey="entityId" />
        </Filter.View>
        <Filter.View filterKey="created" inDialog>
          <Filter.DialogDateView filterKey="created" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const OrdersFilter = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{ entityId: string }>(['entityId']);

  return (
    <Filter id="orders-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="entityId">
          <Filter.BarName>
            <IconReceipt />
            {t('Order ID')}
          </Filter.BarName>
          <Filter.BarButton filterKey="entityId" inDialog>
            {queries?.entityId || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            {t('Status')}
          </Filter.BarName>
          <SelectOrderStatus.FilterBar queryKey="status" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="supplierId">
          <Filter.BarName>
            <IconBuildingStore />
            {t('Supplier')}
          </Filter.BarName>
          <SelectSupplier.FilterBar queryKey="supplierId" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="created">
          <Filter.BarName>
            <IconCalendarPlus />
            {t('Created At')}
          </Filter.BarName>
          <Filter.Date filterKey="created" />
        </Filter.BarItem>
        <OrdersFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};

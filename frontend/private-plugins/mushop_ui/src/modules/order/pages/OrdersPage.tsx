import { IconTruckDelivery } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer, PageSubHeader, Separator } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from 'ui-modules';
import { OrdersFilter } from '../components/OrdersFilter';
import { OrdersTable } from '../components/OrdersTable';
import { OrderDetailSheet } from '../components/OrderDetailSheet';

export const OrdersPage = () => {
  const { t } = useTranslation('mushop');
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mushop/orders">
                    <IconTruckDelivery />
                    {t('Orders')}
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <PageSubHeader>
        <OrdersFilter />
      </PageSubHeader>

      <OrdersTable />

      <OrderDetailSheet />
    </PageContainer>
  );
};

export default OrdersPage;

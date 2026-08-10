import { IconPackage } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from 'ui-modules';
import { ProductsFilter } from '../components/ProductsFilter';
import { ProductsTable } from '../components/ProductsTable';
import { ProductDetailSheet } from '../components/ProductDetailSheet';

export const ProductsPage = () => {
  const { t } = useTranslation('blockadmin');
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/blockadmin/supplier/products">
                    <IconPackage />
                    {t('Products')}
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
        <ProductsFilter />
      </PageSubHeader>

      <ProductsTable />

      <ProductDetailSheet />
    </PageContainer>
  );
};

export default ProductsPage;

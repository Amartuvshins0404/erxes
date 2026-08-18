import { IconPackage } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader, Separator } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from 'ui-modules';
import { ProductsFilter } from '../components/ProductsFilter';
import { ProductsTable } from '../components/ProductsTable';
import { ProductDetailSheet } from '../components/ProductDetailSheet';

export const ProductsPage = () => {
  const { t } = useTranslation('mushop');
  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mushop/products">
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <ProductsTable />
      </div>

      <ProductDetailSheet />
    </div>
  );
};

export default ProductsPage;

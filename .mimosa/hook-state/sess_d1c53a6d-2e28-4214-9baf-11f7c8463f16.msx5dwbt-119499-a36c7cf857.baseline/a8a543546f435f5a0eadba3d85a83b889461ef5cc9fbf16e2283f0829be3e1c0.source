import {
  Badge,
  Button,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Spinner,
  Table,
  useQueryState,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useBaProductDetail } from '../hooks/useBaProductDetail';
import { IBaProduct } from '../types';
import { ProductCategoryAssign } from './ProductCategoryAssign';
import { ProductStatusAction } from './ProductStatusAction';

const statusVariant = (status?: string) => {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'destructive' as const;
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

const ProductInfo = ({ product }: { product: IBaProduct }) => {
  const { t } = useTranslation('blockadmin');
  const {
    _id,
    name,
    code,
    type,
    unitPrice,
    currency,
    uom,
    description,
    status,
    supplier,
    categoryId,
    category,
    initialCategory,
    createdAt,
    updatedAt,
  } = product || {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row label={t('Name')} value={name} />
              <Row label={t('Code')} value={code} />
              <Row label={t('Type')} value={type} />
              <Row
                label={t('Unit Price')}
                value={
                  unitPrice != null
                    ? `${unitPrice.toLocaleString()} ${currency || ''}`.trim()
                    : undefined
                }
              />
              <Row label={t('UOM')} value={uom} />
              <Row
                label={t('Category')}
                value={
                  <ProductCategoryAssign.Provider
                    productId={_id}
                    categoryId={categoryId}
                    category={category}
                    initialCategory={initialCategory}
                  >
                    <ProductCategoryAssign.DetailTrigger />
                  </ProductCategoryAssign.Provider>
                }
              />
              <Row label={t('Supplier')} value={supplier?.name} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                  {t('Status')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                  <ProductStatusAction productId={_id} status={status}>
                    <Badge variant={statusVariant(status)}>
                      {t(status || 'pending')}
                    </Badge>
                  </ProductStatusAction>
                </Table.Cell>
              </Table.Row>
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

      {description && (
        <InfoCard title={t('Description')}>
          <InfoCard.Content className="shadow-none p-2 overflow-hidden whitespace-normal">
            {description}
          </InfoCard.Content>
        </InfoCard>
      )}
    </div>
  );
};

export const ProductDetailSheet = () => {
  const { t } = useTranslation('blockadmin');
  const [activeProductId, setActiveProductId] =
    useQueryState<string>('activeProductId');
  const { product, loading } = useBaProductDetail(activeProductId);

  return (
    <FocusSheet
      open={!!activeProductId}
      onOpenChange={() => setActiveProductId(null)}
    >
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header title={product?.name || t('Product Detail')} />
        <FocusSheet.Content className="flex flex-col flex-auto min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            {loading && (
              <div className="p-4">
                <Spinner />
              </div>
            )}
            {!loading && product && <ProductInfo product={product} />}
            {!loading && !product && (
              <div className="p-4">{t('Product not found')}</div>
            )}
          </ScrollArea>

          <Sheet.Footer className="flex-none border-t">
            <Sheet.Close asChild>
              <Button variant="secondary" className="bg-border">
                {t('Close')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};

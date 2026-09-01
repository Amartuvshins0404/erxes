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
  Dialog,
  readImage,
  BlockEditorReadOnly,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useBaProductDetail } from '../hooks/useBaProductDetail';
import { IBaProduct } from '../types';
import { ProductCategoryAssign } from './ProductCategoryAssign';
import { ProductStatusAction } from './ProductStatusAction';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconX,
  IconZoomIn,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

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
            <BlockEditorReadOnly content={description} />
          </InfoCard.Content>
        </InfoCard>
      )}

      <ProductImages product={product} />
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

type ProductImage = { url: string; name?: string };

const toImage = (att: any): ProductImage | null => {
  if (!att) return null;
  if (typeof att === 'string') return { url: att };
  if (typeof att.url === 'string') return { url: att.url, name: att.name };
  return null;
};

const ProductImages = ({ product }: { product: IBaProduct }) => {
  const { t } = useTranslation('mushop');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const images: ProductImage[] = [
    toImage(product.attachment),
    ...(product.attachmentMore ?? []).map(toImage),
  ].filter((img): img is ProductImage => !!img?.url);

  const open = activeIndex != null;
  const active = activeIndex != null ? images[activeIndex] : null;
  const prev = () =>
    setActiveIndex((i) =>
      i == null ? null : (i - 1 + images.length) % images.length,
    );
  const next = () =>
    setActiveIndex((i) => (i == null ? null : (i + 1) % images.length));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;

  return (
    <InfoCard title={t('Images')}>
      <InfoCard.Content className="shadow-none p-3">
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') && setActiveIndex(index)
              }
              className="group relative shadow-md border border-border rounded-lg w-24 h-24 cursor-zoom-in shrink-0"
            >
              <img
                src={readImage(img.url, 240)}
                alt={img.name || product.name || 'product image'}
                loading="lazy"
                className="rounded-lg w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex justify-center items-center bg-background/30 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                <IconZoomIn
                  size={20}
                  className="text-primary-foreground"
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      </InfoCard.Content>

      <Dialog open={open} onOpenChange={(o) => !o && setActiveIndex(null)}>
        <Dialog.Content className="flex justify-center items-center gap-0 bg-transparent shadow-none p-0 border-0 w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh]">
          <div className="relative flex justify-center items-center w-full h-full">
            {active && (
              <img
                src={readImage(active.url)}
                alt={active.name || product.name || 'product image'}
                className="shadow-2xl rounded max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            )}

            <div className="top-2 right-2 z-60 absolute flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 hover:bg-background rounded-full transition-colors cursor-pointer"
                onClick={() => setActiveIndex(null)}
                aria-label={t('Close')}
              >
                <IconX size={20} />
              </Button>

              {active && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={t('Download')}
                  asChild
                  role="link"
                  className="cursor-pointer"
                >
                  <a
                    target="__blank"
                    href={readImage(active.url)}
                    className="bg-background/80 hover:bg-background rounded-full transition-colors"
                  >
                    <IconDownload />
                  </a>
                </Button>
              )}
            </div>

            {images.length > 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="top-1/2 left-2 z-50 absolute bg-background/80 hover:bg-background rounded-full transition-colors -translate-y-1/2 cursor-pointer"
                onClick={prev}
                aria-label={t('Previous image')}
              >
                <IconChevronLeft size={24} />
              </Button>
            )}

            {images.length > 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="top-1/2 right-2 z-50 absolute bg-background/80 hover:bg-background rounded-full transition-colors -translate-y-1/2 cursor-pointer"
                onClick={next}
                aria-label={t('Next image')}
              >
                <IconChevronRight size={24} />
              </Button>
            )}

            {images.length > 1 && (
              <div className="bottom-2 left-1/2 z-50 absolute bg-background/70 px-3 py-1 rounded-full text-foreground text-xs -translate-x-1/2">
                {(activeIndex ?? 0) + 1} / {images.length}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog>
    </InfoCard>
  );
};

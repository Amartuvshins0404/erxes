import {
  Badge,
  Button,
  Dialog,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Table,
  Tabs,
  readImage,
  useQueryState,
} from 'erxes-ui';
import { ActivityLogs } from 'ui-modules';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconX,
  IconZoomIn,
} from '@tabler/icons-react';
import { ProductCategoryAssign } from './ProductCategoryAssign';
import { format } from 'date-fns';
import { useMushopProductDetail } from '../hooks/useMushopProductDetail';
import { IMushopProduct } from '../types';
import { ProductStatusAction } from './ProductStatusAction';
import { HtmlPreview } from '~/modules/HtmlPreview';

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
    <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
      {label}
    </Table.Cell>
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal">
      {value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

type ProductImage = { url: string; name?: string };

const toImage = (att: any): ProductImage | null => {
  if (!att) return null;
  if (typeof att === 'string') return { url: att };
  if (typeof att.url === 'string') return { url: att.url, name: att.name };
  return null;
};

const ProductImages = ({ product }: { product: IMushopProduct }) => {
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
              className="group relative w-24 h-24 rounded-lg border border-border shadow-md shrink-0 cursor-zoom-in"
            >
              <img
                src={readImage(img.url, 240)}
                alt={img.name || product.name || 'product image'}
                loading="lazy"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
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

      <Dialog
        open={open}
        onOpenChange={(o) => !o && setActiveIndex(null)}
      >
        <Dialog.Content className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] p-0 gap-0 bg-transparent shadow-none border-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-full h-full">
            {active && (
              <img
                src={readImage(active.url)}
                alt={active.name || product.name || 'product image'}
                className="max-w-full max-h-full object-contain rounded shadow-2xl select-none"
                draggable={false}
              />
            )}

            <div className="absolute top-2 right-2 flex flex-col gap-2 z-60">
              <Button
                variant="secondary"
                size="icon"
                className="cursor-pointer bg-background/80 hover:bg-background rounded-full transition-colors"
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
                  className='cursor-pointer'
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
                className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full z-50 transition-colors"
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
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full z-50 transition-colors"
                onClick={next}
                aria-label={t('Next image')}
              >
                <IconChevronRight size={24} />
              </Button>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/70 text-foreground text-xs px-3 py-1 rounded-full z-50">
                {(activeIndex ?? 0) + 1} / {images.length}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog>
    </InfoCard>
  );
};

const ProductInfo = ({ product }: { product: IMushopProduct & { _id: string } }) => {
  const { t } = useTranslation('mushop');
  return (
    <div className="flex flex-col gap-4 p-4">
      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row label={t('Name')} value={product.name} />
              <Row label={t('Short Name')} value={product.shortName} />
              <Row label={t('Code')} value={product.code} />
              <Row label={t('Type')} value={product.type} />
              {product.description && <HtmlPreview label={t('Description')} html={product.description} />}
              <Row
                label={t('Unit Price')}
                value={
                  product.unitPrice != null
                    ? product.unitPrice.toLocaleString()
                    : null
                }
              />
              <Row label={t('UOM')} value={product.uom} />
              <Row label={t('Currency')} value={product.currency} />
              <Row label={t('Supplier')} value={product.supplier?.name || product.vendorId} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
                  {t('Category')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10">
                  <ProductCategoryAssign.Provider
                    productId={product._id}
                    categoryId={product.categoryId}
                    category={product.category}
                    initialCategory={product.initialCategory}
                  >
                    <ProductCategoryAssign.DetailTrigger />
                  </ProductCategoryAssign.Provider>
                </Table.Cell>
              </Table.Row>
              <Row label={t('Barcodes')} value={product.barcodes?.join(', ') || null} />
              <Row label={t('Barcode Description')} value={product.barcodeDescription} />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Status')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground">
                  {t('Status')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                  <ProductStatusAction productId={product._id} status={product.status}>
                    <Badge variant={statusVariant(product.status)} className="cursor-pointer">
                      {t(product.status || 'pending')}
                    </Badge>
                  </ProductStatusAction>
                </Table.Cell>
              </Table.Row>
              <Row
                label={t('Created')}
                value={product.createdAt ? format(new Date(product.createdAt), 'dd.MM.yyyy HH:mm') : null}
              />
              <Row
                label={t('Updated')}
                value={product.updatedAt ? format(new Date(product.updatedAt), 'dd.MM.yyyy HH:mm') : null}
              />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <ProductImages product={product} />
    </div>
  );
};

const TABS = ['overview', 'activity'] as const;

export const ProductDetailSheet = () => {
  const { t } = useTranslation('mushop');
  const [activeProductId, setActiveProductId] = useQueryState<string>('activeProductId');
  const [tab, setTab] = useQueryState<string>('productTab');
  const { product, loading } = useMushopProductDetail(activeProductId);

  const activeTab = tab ?? 'overview';

  return (
    <FocusSheet open={!!activeProductId} onOpenChange={() => setActiveProductId(null)}>
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header title={product?.name || t('Product Detail')} />
        <FocusSheet.Content className="flex flex-auto overflow-hidden flex-row min-h-0">
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
                          {t(tabKey.charAt(0).toUpperCase() + tabKey.slice(1))}
                        </Sidebar.MenuButton>
                      </Sidebar.MenuItem>
                    ))}
                  </Sidebar.Menu>
                </Sidebar.GroupContent>
              </Sidebar.Group>
            </Sidebar.Content>
          </FocusSheet.SideBar>

          <div className="flex flex-col flex-1 min-h-0 min-w-0">
            <Tabs value={activeTab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
              <Tabs.Content value="overview" className="flex-1 min-h-0 data-[state=active]:flex flex-col">
                <ScrollArea className="flex-1 min-h-0">
                  {loading && <div className="p-4"><Spinner /></div>}
                  {!loading && product && <ProductInfo product={product} />}
                  {!loading && !product && <div className="p-4">{t('Product not found')}</div>}
                </ScrollArea>
              </Tabs.Content>

              <Tabs.Content value="activity" className="flex-1 min-h-0 data-[state=active]:flex flex-col">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="flex flex-col mb-12">
                    {!!product?._id && (
                      <ActivityLogs
                        targetId={product._id}
                        showInternalNotes={false}
                      />
                    )}
                  </div>
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

import {
  Badge,
  Button,
  Empty,
  EnumCursorDirection,
  Input,
  Sheet,
  useCursorListQuery,
} from 'erxes-ui';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadMoreSentinel } from 'ui-modules';
import { useDebounce } from 'use-debounce';
import { SIMILARITY_SEARCH_PRODUCTS } from '../graphql/queries';

export interface ChoosableProduct {
  _id: string;
  code: string;
  name?: string;
  unitPrice?: number;
  currency?: string;
  similarityId?: string;
}

const PER_PAGE = 30;

interface ProductChooserSheetProps {
  children: React.ReactNode;
  excludeIds?: string[];
  value?: string;
  valueCode?: string;
  onChoose: (product: ChoosableProduct) => void;
  onClear: () => void;
}

export const ProductChooserSheet = ({
  children,
  excludeIds = [],
  value,
  valueCode,
  onChoose,
  onClear,
}: ProductChooserSheetProps) => {
  const { t } = useTranslation('product', { keyPrefix: 'bulk-similarity' });
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>{children}</Sheet.Trigger>
      <Sheet.View className="sm:max-w-2xl">
        <Sheet.Header>
          <Sheet.Title>{t('products', 'Products')}</Sheet.Title>
          <Sheet.Close />
          <Sheet.Description className="sr-only">
            {t(
              'chooser-description',
              'Search and choose a product to link into this similarity group',
            )}
          </Sheet.Description>
        </Sheet.Header>
        {open && (
          <ChooserBody
            excludeIds={excludeIds}
            value={value}
            valueCode={valueCode}
            onChoose={(product) => {
              onChoose(product);
              setOpen(false);
            }}
            onClear={() => {
              onClear();
            }}
          />
        )}
      </Sheet.View>
    </Sheet>
  );
};

const ChooserBody = ({
  excludeIds,
  value,
  valueCode,
  onChoose,
  onClear,
}: {
  excludeIds: string[];
  value?: string;
  valueCode?: string;
  onChoose: (product: ChoosableProduct) => void;
  onClear: () => void;
}) => {
  const { t } = useTranslation('product', { keyPrefix: 'bulk-similarity' });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);

  const { list, totalCount, loading, handleFetchMore, hasNextPage } =
    useCursorListQuery<ChoosableProduct>(SIMILARITY_SEARCH_PRODUCTS, {
      field: 'productsMain',
      variables: { searchValue: debouncedSearch || undefined },
      limit: PER_PAGE,
    });

  const visible = list.filter(
    (p) => !excludeIds.includes(p._id) && p._id !== value,
  );

  return (
    <>
      <div className="flex gap-2 items-center px-5 py-3 border-b flex-none">
        <Input
          placeholder={t('search-by-code-name', 'Search by code or name…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <span className="text-xs text-muted-foreground shrink-0">
          {t('results', {
            count: totalCount,
            defaultValue: '{{count}} results',
          })}
        </span>
      </div>
      <Sheet.Content className="overflow-auto p-0">
        <div className="flex flex-col gap-1 p-4">
          {value && (
            <Button
              type="button"
              variant="secondary"
              className="justify-start w-full h-auto min-h-9 font-normal text-left"
              onClick={onClear}
              title={t('unlink-product', 'Unlink this product')}
            >
              <IconCheck size={16} className="text-success shrink-0" />
              <div className="flex flex-auto gap-2 items-center min-w-0">
                <span className="font-mono text-xs bg-muted border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                  {valueCode}
                </span>
                <span className="text-muted-foreground">
                  {t('linked', 'Linked')}
                </span>
              </div>
              <IconX size={14} className="ml-auto shrink-0" />
            </Button>
          )}

          {visible.map((product) => {
            const inGroup = !!product.similarityId;

            return (
              <Button
                key={product._id}
                type="button"
                variant="ghost"
                className="justify-start w-full h-auto min-h-9 font-normal text-left"
                onClick={() => onChoose(product)}
                disabled={inGroup}
                title={
                  inGroup
                    ? t('already-in-group', 'Already in a similarity group')
                    : undefined
                }
              >
                <div className="flex flex-auto gap-2 items-center min-w-0">
                  <span className="font-mono text-xs bg-muted border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                    {product.code}
                  </span>
                  <span className="truncate">{product.name}</span>
                  <span className="flex gap-2 items-center ml-auto shrink-0">
                    {inGroup && (
                      <Badge variant="secondary">
                        {t('in-a-group', 'in a group')}
                      </Badge>
                    )}
                    {product.unitPrice != null && (
                      <span className="text-xs font-medium tabular-nums">
                        <span className="mr-0.5 font-normal text-muted-foreground">
                          {product.currency ?? ''}
                        </span>
                        {product.unitPrice.toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              </Button>
            );
          })}

          {!loading && !visible.length && (
            <Empty className="py-8">
              <Empty.Header>
                <Empty.Title>
                  {t('no-products-found', 'No products found.')}
                </Empty.Title>
              </Empty.Header>
            </Empty>
          )}

          <LoadMoreSentinel
            hasMore={!!hasNextPage}
            loading={loading}
            onLoadMore={() =>
              handleFetchMore({ direction: EnumCursorDirection.FORWARD })
            }
          />
        </div>
      </Sheet.Content>
    </>
  );
};

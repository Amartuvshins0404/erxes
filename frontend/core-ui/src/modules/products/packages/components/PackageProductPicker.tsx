import { IconMinus, IconPackageOff, IconPlus } from '@tabler/icons-react';
import {
  Button,
  Checkbox,
  Empty,
  InfoCard,
  Input,
  Skeleton,
  cn,
} from 'erxes-ui';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IProduct, LoadMoreSentinel } from 'ui-modules';
import { useProducts } from 'ui-modules/modules/products/hooks/useProducts';
import { IPackageProduct } from '../types/Package';

const formatNumber = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
        value,
      );

const clamp = (n: number) => Math.min(999, Math.max(1, n));

const QtyControl = ({
  qty,
  disabled,
  onChange,
}: {
  qty: number;
  disabled?: boolean;
  onChange: (qty: number) => void;
}) => (
  <div className="flex items-center gap-0.5 shrink-0">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 rounded-full"
      disabled={disabled || qty <= 1}
      onClick={() => onChange(clamp(qty - 1))}
    >
      <IconMinus className="size-3" />
    </Button>
    <Input.Number
      value={qty}
      disabled={disabled}
      scale={0}
      min={1}
      max={999}
      onChange={(next) => onChange(clamp(Number(next) || 1))}
      className="h-6 w-10 px-1 text-center tabular-nums shadow-none bg-transparent"
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 rounded-full"
      disabled={disabled || qty >= 999}
      onClick={() => onChange(clamp(qty + 1))}
    >
      <IconPlus className="size-3" />
    </Button>
  </div>
);

const ProductRow = ({
  product,
  item,
  disabled,
  onToggle,
  onQtyChange,
}: {
  product: Pick<IProduct, '_id' | 'name' | 'code' | 'unitPrice'>;
  item?: IPackageProduct;
  disabled?: boolean;
  onToggle: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
}) => {
  const checked = !!item;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input,button')) return;
    onToggle(product._id);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 hover:bg-accent px-3 py-1 transition-colors cursor-pointer',
        checked && 'bg-primary/5',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
      onClick={handleRowClick}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => onToggle(product._id)}
        className="pointer-events-none shrink-0"
      />
      <span className="flex-auto min-w-0 font-medium text-sm truncate">
        {product.name || product.code || product._id}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {product.code && (
          <span className="max-w-28 font-mono text-muted-foreground text-xs truncate">
            {product.code}
          </span>
        )}
        <span className="tabular-nums text-muted-foreground text-sm">
          {formatNumber(product.unitPrice)}
        </span>
        <QtyControl
          qty={item?.quantity ?? 1}
          disabled={disabled || !checked}
          onChange={(qty) => onQtyChange(product._id, qty)}
        />
      </div>
    </div>
  );
};

export const PackageProductPicker = ({
  value,
  onChange,
  onTotalChange,
  disabled,
}: {
  value: IPackageProduct[];
  onChange: (items: IPackageProduct[]) => void;
  onTotalChange?: (total: number) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation('product', { keyPrefix: 'package' });
  const { products, loading, fetchingMore, handleFetchMore, totalCount } =
    useProducts({
      variables: {},
    });

  const itemMap = useMemo(
    () => new Map(value.map((p) => [p.productId, p])),
    [value],
  );

  const priceCache = useRef<Record<string, number>>({});

  const computeTotal = (items: IPackageProduct[]) =>
    items.reduce(
      (sum, p) => sum + (priceCache.current[p.productId] || 0) * p.quantity,
      0,
    );

  useEffect(() => {
    for (const p of products) {
      priceCache.current[p._id] = Number(p.unitPrice) || 0;
    }
    onTotalChange?.(computeTotal(value));
  }, [products]);

  const handleToggle = (productId: string) => {
    const next = itemMap.has(productId)
      ? value.filter((p) => p.productId !== productId)
      : [...value, { productId, quantity: 1 }];
    onChange(next);
    onTotalChange?.(computeTotal(next));
  };

  const handleQtyChange = (productId: string, qty: number) => {
    const next = value.map((p) =>
      p.productId === productId ? { ...p, quantity: qty } : p,
    );
    onChange(next);
    onTotalChange?.(computeTotal(next));
  };

  const hasMore = products.length < totalCount;

  return (
    <InfoCard
      title={t('products-count', {
        count: value.length,
        defaultValue: 'Products ({{count}})',
      })}
      className="flex-auto overflow-hidden"
    >
      <InfoCard.Content className="p-0 overflow-auto">
        {loading && !products.length ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Empty className="py-12">
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconPackageOff />
              </Empty.Media>
              <Empty.Title>
                {t('no-products-found', 'No products found.')}
              </Empty.Title>
            </Empty.Header>
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((p) => (
              <li key={p._id}>
                <ProductRow
                  product={p}
                  item={itemMap.get(p._id)}
                  disabled={disabled}
                  onToggle={handleToggle}
                  onQtyChange={handleQtyChange}
                />
              </li>
            ))}
            <li>
              <LoadMoreSentinel
                hasMore={hasMore}
                loading={fetchingMore}
                onLoadMore={handleFetchMore}
              />
            </li>
          </ul>
        )}
      </InfoCard.Content>
    </InfoCard>
  );
};

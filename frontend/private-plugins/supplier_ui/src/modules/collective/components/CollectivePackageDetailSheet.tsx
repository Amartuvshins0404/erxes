import { IconCheck, IconPackage, IconPackageOff } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Checkbox,
  cn,
  InfoCard,
  Input,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  Textarea,
  toast,
  useQueryState,
} from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { useCollectivePackageDetail } from '../hooks/useCollectivePackageDetail';
import { ICollectivePackage } from '../hooks/useCollectivePackages';
import { useEditCollectivePackage } from '../hooks/useEditCollectivePackage';
import { useEditCollectivePackageStatus } from '../hooks/useEditCollectivePackageStatus';
import { IPoscProduct, usePoscProducts } from '../hooks/usePoscProducts';
import { usePosclientConfigs } from '../hooks/usePosclientConfigs';
import { UploadImage } from '@/supplier/components/upload';

const PACKAGE_STATUSES = ['draft', 'active', 'archived'] as const;

const formatNumber = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
        value,
      );

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="font-medium text-sm">{children}</label>
);

const ProductPicker = ({
  posToken,
  selectedIds,
  onToggle,
  disabled,
}: {
  posToken: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}) => {
  const { products, loading } = usePoscProducts({
    posToken,
    perPage: 200,
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (!posToken) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-sm text-center">
        <IconPackageOff className="opacity-60 size-6" />
        <span>No POS configured for this package.</span>
      </div>
    );
  }

  if (loading && !products.length) {
    return (
      <div className="flex justify-center items-center gap-2 py-12 text-muted-foreground text-sm">
        <Spinner /> Loading products…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-sm text-center">
        <IconPackageOff className="opacity-60 size-6" />
        <span>No products for this POS.</span>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {products.map((p: IPoscProduct) => {
        const checked = selectedSet.has(p._id);
        return (
          <li key={p._id}>
            <label
              className={cn(
                'group relative flex items-center gap-3 hover:bg-muted/60 px-4 py-2.5 transition-colors cursor-pointer',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => onToggle(p._id)}
              />
              <span className="flex-auto min-w-0 font-medium text-sm truncate">
                {p.name || p.code || p._id}
              </span>
              {p.code ? (
                <span className="font-mono text-muted-foreground text-xs truncate shrink-0">
                  {p.code}
                </span>
              ) : null}
              <span className="font-medium tabular-nums text-sm shrink-0">
                {p.unitPrice != null ? formatNumber(p.unitPrice) : '—'}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
};

const PackageDetailEditor = ({
  pkg,
  onClose,
}: {
  pkg: ICollectivePackage;
  onClose: () => void;
}) => {
  const { configs } = usePosclientConfigs();
  const posName = useMemo(() => {
    const match = configs.find((c) => c.token === pkg.posToken);
    return match?.name || pkg.posToken;
  }, [configs, pkg.posToken]);

  const { editStatus, loading: savingStatus } = useEditCollectivePackageStatus();
  const { editPackage, loading: savingEdits } = useEditCollectivePackage(
    pkg._id,
  );

  const [name, setName] = useState(pkg.name || '');
  const [description, setDescription] = useState(pkg.description || '');
  const [coverImage, setCoverImage] = useState(pkg.coverImage || '');
  const [price, setPrice] = useState<string>(
    pkg.price != null ? String(pkg.price) : '',
  );
  const [productIds, setProductIds] = useState<string[]>(pkg.productIds || []);
  const [status, setStatus] = useState<string>(pkg.status || 'draft');

  useEffect(() => {
    setName(pkg.name || '');
    setDescription(pkg.description || '');
    setCoverImage(pkg.coverImage || '');
    setPrice(pkg.price != null ? String(pkg.price) : '');
    setProductIds(pkg.productIds || []);
    setStatus(pkg.status || 'draft');
  }, [
    pkg._id,
    pkg.name,
    pkg.description,
    pkg.coverImage,
    pkg.price,
    pkg.productIds,
    pkg.status,
  ]);

  const basicDirty =
    name !== (pkg.name || '') ||
    description !== (pkg.description || '') ||
    coverImage !== (pkg.coverImage || '') ||
    price !== (pkg.price != null ? String(pkg.price) : '') ||
    productIds.length !== (pkg.productIds || []).length ||
    productIds.some((id, i) => id !== (pkg.productIds || [])[i]);

  const statusDirty = status !== (pkg.status || 'draft');
  const dirty = basicDirty || statusDirty;
  const saving = savingEdits || savingStatus;

  const handleToggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    if (!productIds.length) {
      toast({
        variant: 'destructive',
        title: 'At least one product is required',
      });
      return;
    }

    const parsedPrice = price.trim() === '' ? null : Number(price);
    if (parsedPrice != null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      toast({
        variant: 'destructive',
        title: 'Price must be a non-negative number',
      });
      return;
    }

    try {
      const promises: Promise<unknown>[] = [];

      if (basicDirty) {
        promises.push(
          editPackage({
            variables: {
              _id: pkg._id,
              name,
              description,
              coverImage,
              price: parsedPrice,
              productIds,
            },
          }),
        );
      }

      if (statusDirty) {
        promises.push(
          editStatus({ variables: { _id: pkg._id, status } }),
        );
      }

      await Promise.all(promises);
      toast({ variant: 'success', title: 'Package updated' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update package',
        description: e?.message,
      });
    }
  };

  return (
    <>
      <Sheet.Content className="flex flex-auto p-0 overflow-hidden">
        <ScrollArea className="border-r w-2/5 h-full shrink-0">
          <div className="flex flex-col gap-4 p-5">
            <InfoCard title="Basic information">
              <InfoCard.Content>
                <div className="gap-4 grid grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      disabled={saving}
                      onValueChange={setStatus}
                    >
                      <Select.Trigger className="h-8">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {PACKAGE_STATUSES.map((s) => (
                          <Select.Item key={s} value={s}>
                            {s}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      className="min-h-20"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </InfoCard.Content>
            </InfoCard>

            <InfoCard title="Attachment">
              <InfoCard.Content>
                <UploadImage
                  value={coverImage}
                  onValueChange={(value) => setCoverImage(value || '')}
                  uploaderClassName="w-full"
                  className="w-full aspect-video"
                />
              </InfoCard.Content>
            </InfoCard>

            <InfoCard title="Pricing">
              <InfoCard.Content>
                <div className="gap-4 grid grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>POS</Label>
                    <Input value={posName || ''} readOnly />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </InfoCard.Content>
            </InfoCard>
          </div>
        </ScrollArea>

        <ScrollArea className="flex-auto bg-muted/20 h-full">
          <div className="p-5">
            <InfoCard title={`Products (${productIds.length})`}>
              <InfoCard.Content className="p-0">
                <ProductPicker
                  posToken={pkg.posToken}
                  selectedIds={productIds}
                  onToggle={handleToggleProduct}
                  disabled={saving}
                />
              </InfoCard.Content>
            </InfoCard>
          </div>
        </ScrollArea>
      </Sheet.Content>

      <Sheet.Footer className="flex-none items-center gap-2">
        {dirty && <Badge variant="info">Unsaved changes</Badge>}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="gap-2"
          >
            <IconCheck className="size-4" />
            Save
          </Button>
        </div>
      </Sheet.Footer>
    </>
  );
};

export const CollectivePackageDetailSheet = () => {
  const [activePackageId, setActivePackageId] =
    useQueryState<string>('activePackageId');
  const { package: pkg, loading } = useCollectivePackageDetail(activePackageId);

  const handleClose = () => setActivePackageId(null);

  return (
    <Sheet
      open={!!activePackageId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <Sheet.View className="p-0 sm:max-w-5xl">
        <div className="flex flex-col flex-auto overflow-hidden">
          <Sheet.Header className="flex gap-2">
            <IconPackage />
            <Sheet.Title>{pkg?.name || 'Package detail'}</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>

          {loading && !pkg ? (
            <>
              <div className="flex flex-auto justify-center items-center">
                <Spinner />
              </div>
              <Sheet.Footer className="flex-none">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </Sheet.Footer>
            </>
          ) : pkg ? (
            <PackageDetailEditor pkg={pkg} onClose={handleClose} />
          ) : (
            <>
              <div className="flex flex-auto justify-center items-center p-6 text-muted-foreground text-sm">
                Package not found
              </div>
              <Sheet.Footer className="flex-none">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </Sheet.Footer>
            </>
          )}
        </div>
      </Sheet.View>
    </Sheet>
  );
};

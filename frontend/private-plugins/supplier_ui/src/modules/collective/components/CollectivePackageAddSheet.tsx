import { IconPackage, IconPlus, IconPackageOff } from '@tabler/icons-react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Form,
  InfoCard,
  Input,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  Textarea,
  cn,
  toast,
} from 'erxes-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAddCollectivePackage } from '../hooks/useAddCollectivePackage';
import { IPoscProduct, usePoscProducts } from '../hooks/usePoscProducts';
import {
  IPosclientConfig,
  usePosclientConfigs,
} from '../hooks/usePosclientConfigs';
import { UploadImage } from '@/supplier/components/upload';

const STATUS_OPTIONS = ['draft', 'active', 'archived'] as const;

const packageFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  posToken: z.string().trim().min(1, 'POS is required'),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
  price: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      'Price must be a non-negative number',
    ),
  status: z.enum(STATUS_OPTIONS).default('draft'),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

export const CollectivePackageAddSheet = () => {
  const [open, setOpen] = useState(false);
  const { addPackage, loading: saving } = useAddCollectivePackage();

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: '',
      description: '',
      coverImage: '',
      posToken: '',
      productIds: [],
      price: '',
      status: 'draft',
    },
  });

  const posToken = form.watch('posToken');
  const productIds = form.watch('productIds');

  const priceManuallyEdited = useRef(false);

  const { configs, loading: loadingConfigs } = usePosclientConfigs();
  const { products, loading: loadingProducts } = usePoscProducts({
    posToken,
  });

  const selectedSet = useMemo(() => new Set(productIds), [productIds]);

  // Cache of every selected product's unitPrice, by id, so the sum survives
  // search-filter changes that exclude already-picked products from `products`.
  const priceCache = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const p of products) {
      if (p.unitPrice != null) {
        priceCache.current[p._id] = Number(p.unitPrice);
      }
    }
  }, [products]);

  const computedTotal = useMemo(() => {
    return productIds.reduce(
      (sum, id) => sum + (priceCache.current[id] || 0),
      0,
    );
  }, [productIds, products]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (priceManuallyEdited.current) return;
    if (!productIds.length) {
      form.setValue('price', '', { shouldValidate: false });
      return;
    }
    form.setValue('price', computedTotal ? String(computedTotal) : '', {
      shouldValidate: false,
    });
  }, [computedTotal, productIds.length, form]);

  const togglePicked = (id: string) => {
    const next = selectedSet.has(id)
      ? productIds.filter((p) => p !== id)
      : [...productIds, id];
    form.setValue('productIds', next, { shouldValidate: true });
  };

  const resetForm = () => {
    form.reset();
    priceManuallyEdited.current = false;
    priceCache.current = {};
  };

  const onSubmit = async (values: PackageFormValues) => {
    try {
      await addPackage({
        variables: {
          input: {
            name: values.name,
            description: values.description || undefined,
            coverImage: values.coverImage || undefined,
            posToken: values.posToken,
            productIds: values.productIds,
            price: values.price ? Number(values.price) : undefined,
            status: values.status,
          },
        },
      });
      toast({ variant: 'success', title: 'Package created' });
      resetForm();
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create package',
        description: e?.message,
      });
    }
  };

  const onPosChange = (token: string) => {
    form.setValue('posToken', token, { shouldValidate: true });
    form.setValue('productIds', [], { shouldValidate: true });
    priceManuallyEdited.current = false;
    priceCache.current = {};
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <Sheet.Trigger asChild>
        <Button>
          <IconPlus />
          New package
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-auto overflow-hidden"
          >
            <Sheet.Header className="flex gap-2">
              <IconPackage />
              <Sheet.Title>New collective package</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>

            <Sheet.Content className="flex flex-auto p-0 overflow-hidden">
              {/* Left: form fields */}
              <ScrollArea className="border-r w-2/5 h-full shrink-0">
                <div className="flex flex-col gap-4 p-5">
                  <InfoCard title="Basic information">
                    <InfoCard.Content>
                      <div className="gap-4 grid grid-cols-2">
                        <Form.Field
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>Name</Form.Label>
                              <Form.Control>
                                <Input {...field} />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />

                        <Form.Field
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>Status</Form.Label>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <Form.Control>
                                  <Select.Trigger className="h-8">
                                    <Select.Value placeholder="Select status" />
                                  </Select.Trigger>
                                </Form.Control>
                                <Select.Content>
                                  {STATUS_OPTIONS.map((s) => (
                                    <Select.Item key={s} value={s}>
                                      {s}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />

                        <Form.Field
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <Form.Item className="col-span-2">
                              <Form.Label>Description</Form.Label>
                              <Form.Control>
                                <Textarea
                                  className="min-h-20"
                                  rows={4}
                                  {...field}
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                      </div>
                    </InfoCard.Content>
                  </InfoCard>

                  <InfoCard title="Attachment">
                    <InfoCard.Content>
                      <Form.Field
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                          <Form.Item>
                            <UploadImage
                              value={field.value}
                              onValueChange={(value) =>
                                field.onChange(value || '')
                              }
                              uploaderClassName="w-full"
                              className="w-full aspect-video"
                            />
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </InfoCard.Content>
                  </InfoCard>

                  <InfoCard title="Pricing">
                    <InfoCard.Content>
                      <div className="gap-4 grid grid-cols-2">
                        <Form.Field
                          control={form.control}
                          name="posToken"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>POS</Form.Label>
                              <Select
                                value={field.value}
                                onValueChange={onPosChange}
                                disabled={loadingConfigs}
                              >
                                <Form.Control>
                                  <Select.Trigger className="h-8">
                                    <Select.Value
                                      placeholder={
                                        loadingConfigs
                                          ? 'Loading…'
                                          : 'Select a POS'
                                      }
                                    />
                                  </Select.Trigger>
                                </Form.Control>
                                <Select.Content>
                                  {configs.length === 0 && !loadingConfigs ? (
                                    <div className="px-2 py-1.5 text-muted-foreground text-sm">
                                      No POSes available
                                    </div>
                                  ) : null}
                                  {configs.map((c: IPosclientConfig) => (
                                    <Select.Item key={c.token} value={c.token}>
                                      {c.name || c.token}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />

                        <Form.Field
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label className="flex justify-between items-center">
                                <span>Price</span>
                              </Form.Label>
                              <Form.Control>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    priceManuallyEdited.current = true;
                                    field.onChange(e);
                                  }}
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                      </div>
                    </InfoCard.Content>
                  </InfoCard>

                  {/* Hidden field so RHF tracks productIds errors */}
                  <Form.Field
                    control={form.control}
                    name="productIds"
                    render={() => (
                      <Form.Item>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </ScrollArea>

              {/* Right: product picker */}
              <ScrollArea className="flex-auto bg-muted/20 h-full">
                <div className="p-5">
                  <InfoCard title="Products">
                    <InfoCard.Content className="p-0">
                      {!posToken ? (
                        <div className="flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-sm text-center">
                          <IconPackageOff className="opacity-60 size-6" />
                          <span>Select a POS to browse its products.</span>
                        </div>
                      ) : loadingProducts ? (
                        <div className="flex justify-center items-center gap-2 py-12 text-muted-foreground text-sm">
                          <Spinner /> Loading products…
                        </div>
                      ) : products.length === 0 ? (
                        <div className="flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-sm text-center">
                          <IconPackageOff className="opacity-60 size-6" />
                          <span>No products for this POS.</span>
                        </div>
                      ) : (
                        <ul className="divide-y">
                          {products.map((p: IPoscProduct) => {
                            const checked = selectedSet.has(p._id);
                            return (
                              <li key={p._id}>
                                <label
                                  className={cn(
                                    'group relative flex items-center gap-3 hover:bg-muted/60 px-4 py-2.5 transition-colors cursor-pointer',
                                  )}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => togglePicked(p._id)}
                                  />
                                  <span
                                    className={cn(
                                      'flex-auto min-w-0 font-medium text-sm truncate',
                                    )}
                                  >
                                    {p.name || p.code || p._id}
                                  </span>
                                  {p.code ? (
                                    <span className="font-mono text-muted-foreground text-xs truncate shrink-0">
                                      {p.code}
                                    </span>
                                  ) : null}
                                  <span className="font-medium tabular-nums text-sm shrink-0">
                                    {p.unitPrice != null
                                      ? formatNumber(p.unitPrice)
                                      : '—'}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </InfoCard.Content>
                  </InfoCard>
                </div>
              </ScrollArea>
            </Sheet.Content>

            <Sheet.Footer className="flex-none">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner containerClassName="flex-none" />}
                Create
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
};

import {
  Button,
  Sheet,
  Form,
  Spinner,
  Select,
  Label,
  Input,
  Checkbox,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  useCreatePromoCode,
  useUpdatePromoCode,
} from '../hooks/usePromoCodeMutations';
import { ONE_FIT_PROMO_CODE } from '../graphql/promoCodeQueries';
import { PromoCodeDiscountType } from '../types/promoCode';

const basePromoCodeSchema = z.object({
  code: z.string().min(1, { message: 'Code is required' }),
  discountType: z.enum([
    PromoCodeDiscountType.PERCENT,
    PromoCodeDiscountType.FIXED,
  ]),
  value: z.number().min(0, { message: 'Value must be 0 or greater' }),
  isCompanyTag: z.boolean().default(false),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  usageLimit: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

const createPromoCodeSchema = basePromoCodeSchema;
const editPromoCodeSchema = basePromoCodeSchema.partial();

type CreatePromoCodeFormData = z.infer<typeof createPromoCodeSchema>;
type EditPromoCodeFormData = z.infer<typeof editPromoCodeSchema>;

interface PromoCodeDialogProps {
  mode: 'create' | 'edit';
  promoCodeId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const PromoCodeDialog = ({
  mode,
  promoCodeId,
  open,
  onOpenChange,
  onClose,
}: PromoCodeDialogProps) => {
  const isCreate = mode === 'create';
  const [internalOpen, setInternalOpen] = useState(false);

  const effectiveOpen = open !== undefined ? open : internalOpen;
  const effectiveOnOpenChange =
    onOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));

  if (isCreate) {
    return (
      <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Create Promo Code
          </Button>
        </Sheet.Trigger>
        <Sheet.View className="sm:max-w-lg">
          <Sheet.Header>
            <Sheet.Title>Create Promo Code</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
          <PromoCodeForm
            mode="create"
            onClose={() => {
              effectiveOnOpenChange(false);
              onClose?.();
            }}
          />
        </Sheet.View>
      </Sheet>
    );
  }

  return (
    <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
      <Sheet.View className="sm:max-w-lg">
        <Sheet.Header>
          <Sheet.Title>Edit Promo Code</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <PromoCodeForm
          mode="edit"
          promoCodeId={promoCodeId!}
          onClose={() => {
            effectiveOnOpenChange(false);
            onClose?.();
          }}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const CreatePromoCodeDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <PromoCodeDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      onClose={() => setOpen(false)}
    />
  );
};

export const EditPromoCodeDialog = ({
  promoCodeId,
  open,
  onOpenChange,
  onClose,
}: Omit<PromoCodeDialogProps, 'mode'> & { promoCodeId: string }) => (
  <PromoCodeDialog
    mode="edit"
    promoCodeId={promoCodeId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);

interface PromoCodeFormProps {
  mode: 'create' | 'edit';
  promoCodeId?: string;
  onClose: () => void;
}

function toDateInputValue(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const PromoCodeForm = ({ mode, promoCodeId, onClose }: PromoCodeFormProps) => {
  const isCreate = mode === 'create';

  const { data: promoCodeData, loading: queryLoading } = useQuery(
    ONE_FIT_PROMO_CODE,
    {
      variables: { _id: promoCodeId },
      skip: isCreate || !promoCodeId,
    },
  );

  const promoCode = promoCodeData?.oneFitPromoCode;

  const form = useForm<CreatePromoCodeFormData | EditPromoCodeFormData>({
    resolver: zodResolver(
      isCreate ? createPromoCodeSchema : editPromoCodeSchema,
    ),
    defaultValues: {
      code: '',
      discountType: PromoCodeDiscountType.PERCENT,
      value: 0,
      isCompanyTag: false,
      validFrom: '',
      validTo: '',
      usageLimit: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isCreate && promoCode) {
      form.reset({
        code: promoCode.code ?? '',
        discountType:
          (promoCode.discountType as CreatePromoCodeFormData['discountType']) ??
          PromoCodeDiscountType.PERCENT,
        value: promoCode.value ?? 0,
        isCompanyTag: promoCode.isCompanyTag ?? false,
        validFrom: toDateInputValue(promoCode.validFrom),
        validTo: toDateInputValue(promoCode.validTo),
        usageLimit: promoCode.usageLimit ?? undefined,
        isActive: promoCode.isActive ?? true,
      });
    }
  }, [promoCode, isCreate, form]);

  const { createPromoCode, loading: createLoading } = useCreatePromoCode();
  const { updatePromoCode, loading: updateLoading } = useUpdatePromoCode();

  const loading = createLoading || updateLoading || queryLoading;

  const onSubmit = async (
    data: CreatePromoCodeFormData | EditPromoCodeFormData,
  ) => {
    try {
      const payload = {
        ...data,
        validFrom: data.validFrom
          ? new Date(data.validFrom).toISOString()
          : undefined,
        validTo: data.validTo
          ? new Date(data.validTo).toISOString()
          : undefined,
        usageLimit:
          data.usageLimit !== undefined && data.usageLimit !== null
            ? data.usageLimit
            : undefined,
      };
      if (isCreate) {
        await createPromoCode({
          variables: payload as CreatePromoCodeFormData,
        });
      } else {
        await updatePromoCode({
          variables: {
            _id: promoCodeId!,
            ...payload,
          },
        });
      }
      onClose();
    } catch {
      // Error handled in mutation hook (toast)
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <Form.Field
          control={form.control}
          name="code"
          render={({ field }) => (
            <Form.Item>
              <Label>Code</Label>
              <Input
                {...field}
                placeholder="e.g. SAVE20"
                disabled={!isCreate}
                className="font-mono uppercase"
              />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <Form.Item>
              <Label>Discount Type</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Select.Trigger>
                  <Select.Value placeholder="Select type" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={PromoCodeDiscountType.PERCENT}>
                    Percent
                  </Select.Item>
                  <Select.Item value={PromoCodeDiscountType.FIXED}>
                    Fixed
                  </Select.Item>
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="value"
          render={({ field }) => (
            <Form.Item>
              <Label>Value</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                {...field}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ''
                      ? 0
                      : Number.parseFloat(e.target.value),
                  )
                }
              />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="isCompanyTag"
          render={({ field }) => (
            <Form.Item className="flex flex-row items-center gap-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label>Company tag (B2B)</Label>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="validFrom"
          render={({ field }) => (
            <Form.Item>
              <Label>Valid From (optional)</Label>
              <Input type="date" {...field} value={field.value ?? ''} />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="validTo"
          render={({ field }) => (
            <Form.Item>
              <Label>Valid To (optional)</Label>
              <Input type="date" {...field} value={field.value ?? ''} />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <Form.Item>
              <Label>Usage Limit (optional, empty = unlimited)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Unlimited"
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === '' ? undefined : Number.parseInt(v, 10));
                }}
              />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <Form.Item className="flex flex-row items-center gap-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label>Active</Label>
              <Form.Message />
            </Form.Item>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            {isCreate ? 'Create' : 'Update'} Promo Code
          </Button>
        </div>
      </form>
    </Form>
  );
};

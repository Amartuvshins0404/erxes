import {
  Button,
  Sheet,
  Form,
  Spinner,
  Select,
  Label,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  useCreateBanner,
  useUpdateBanner,
} from '../hooks/useBannerMutations';
import { ONE_FIT_BANNER } from '../graphql/bannerQueries';
import { BannerType, BannerStatus } from '../types/banner';
import { SelectProvider } from './SelectProvider';
import { useUploadConfig } from '../../config/hooks/useUploadConfig';
import { OneFitUpload } from '~/components/onefit-upload';

const baseBannerSchema = z.object({
  image: z.string().min(1, { message: 'Image is required' }),
  providerId: z.string().min(1, { message: 'Provider is required' }),
  type: z.nativeEnum(BannerType),
  status: z.nativeEnum(BannerStatus).default(BannerStatus.ACTIVE),
});

const createBannerSchema = baseBannerSchema;
const editBannerSchema = baseBannerSchema.partial();

type CreateBannerFormData = z.infer<typeof createBannerSchema>;
type EditBannerFormData = z.infer<typeof editBannerSchema>;

interface BannerDialogProps {
  mode: 'create' | 'edit';
  bannerId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const BannerDialog = ({
  mode,
  bannerId,
  open,
  onOpenChange,
  onClose,
}: BannerDialogProps) => {
  const isCreate = mode === 'create';
  const [internalOpen, setInternalOpen] = useState(false);
  const { uploadUrl } = useUploadConfig();

  const effectiveOpen = open !== undefined ? open : internalOpen;
  const effectiveOnOpenChange =
    onOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));

  if (isCreate) {
    return (
      <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Create Banner
          </Button>
        </Sheet.Trigger>
        <Sheet.View className="sm:max-w-lg">
          <Sheet.Header>
            <Sheet.Title>Create Banner</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
          <BannerForm
            mode="create"
            uploadurl={uploadUrl}
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
          <Sheet.Title>Edit Banner</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <BannerForm
          mode="edit"
          bannerId={bannerId!}
          uploadurl={uploadUrl}
          onClose={() => {
            effectiveOnOpenChange(false);
            onClose?.();
          }}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const CreateBannerDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <BannerDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      onClose={() => setOpen(false)}
    />
  );
};

export const EditBannerDialog = ({
  bannerId,
  open,
  onOpenChange,
  onClose,
}: Omit<BannerDialogProps, 'mode'> & { bannerId: string }) => (
  <BannerDialog
    mode="edit"
    bannerId={bannerId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);

interface BannerFormProps {
  mode: 'create' | 'edit';
  bannerId?: string;
  uploadurl?: string;
  onClose: () => void;
}

const BannerForm = ({
  mode,
  bannerId,
  uploadurl,
  onClose,
}: BannerFormProps) => {
  const isCreate = mode === 'create';

  const { data: bannerData, loading: queryLoading } = useQuery(
    ONE_FIT_BANNER,
    {
      variables: { _id: bannerId },
      skip: isCreate || !bannerId,
    },
  );

  const banner = bannerData?.oneFitBanner;

  const form = useForm<CreateBannerFormData | EditBannerFormData>({
    resolver: zodResolver(isCreate ? createBannerSchema : editBannerSchema),
    defaultValues: {
      image: '',
      providerId: '',
      type: BannerType.ADULT,
      status: BannerStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (!isCreate && banner) {
      form.reset({
        image: banner.image || '',
        providerId: banner.providerId || '',
        type: (banner.type as BannerType) || BannerType.ADULT,
        status: (banner.status as BannerStatus) || BannerStatus.ACTIVE,
      });
    }
  }, [banner, isCreate, form]);

  const { createBanner, loading: createLoading } = useCreateBanner();
  const { updateBanner, loading: updateLoading } = useUpdateBanner();

  const loading = createLoading || updateLoading || queryLoading;

  const onSubmit = async (data: CreateBannerFormData | EditBannerFormData) => {
    try {
      if (isCreate) {
        await createBanner({
          variables: {
            image: data.image,
            providerId: data.providerId,
            type: data.type,
            status: data.status,
          },
        });
      } else {
        await updateBanner({
          variables: {
            _id: bannerId!,
            ...data,
          },
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const imageValue = form.watch('image');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <Form.Field
          control={form.control}
          name="image"
          render={({ field }) => (
            <Form.Item>
              <Label>Image</Label>
              <OneFitUpload.Root
                value={field.value || ''}
                onChange={(value) => field.onChange(value.url)}
                uploadUrl={uploadurl}
              >
                <div className="w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px]">
                  {imageValue ? (
                    <OneFitUpload.Preview className="max-h-[200px] max-w-full rounded" />
                  ) : (
                    <div className="text-center">
                      <OneFitUpload.Button variant="outline" type="button">
                        Upload Image
                      </OneFitUpload.Button>
                    </div>
                  )}
                </div>
              </OneFitUpload.Root>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <Form.Item>
              <Label>Provider</Label>
              <SelectProvider
                selected={field.value}
                onSelect={field.onChange}
              />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="type"
          render={({ field }) => (
            <Form.Item>
              <Label>Type</Label>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select type" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={BannerType.ADULT}>Adult</Select.Item>
                  <Select.Item value={BannerType.CHILD}>Child</Select.Item>
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="status"
          render={({ field }) => (
            <Form.Item>
              <Label>Status</Label>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select status" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={BannerStatus.ACTIVE}>Active</Select.Item>
                  <Select.Item value={BannerStatus.INACTIVE}>Inactive</Select.Item>
                </Select.Content>
              </Select>
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
            {isCreate ? 'Create' : 'Update'} Banner
          </Button>
        </div>
      </form>
    </Form>
  );
};

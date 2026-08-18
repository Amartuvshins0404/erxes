import {
  Button,
  Checkbox,
  Sheet,
  Form,
  Input,
  Spinner,
  Textarea,
  Switch,
  Label,
} from 'erxes-ui';
import { IconPlus, IconUpload, IconTrash, IconX } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  useCreateProvider,
  useUpdateProvider,
} from '../hooks/useProviderMutations';
import { ONE_FIT_PROVIDER } from '../graphql/providerQueries';
import { ProviderStatus } from '../types/provider';
import { SelectCategories } from './SelectCategories';
import { SelectCity } from './SelectCity';
import { SelectDistrict } from './SelectDistrict';
import { ProviderLocationMap } from './ProviderLocationMap';
import { useUploadConfig } from '../../config/hooks/useUploadConfig';
import { getImageReadUrl, extractImageKey } from '../utils/imageUtils';
import { OneFitUpload } from '~/components/onefit-upload';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '~/modules/category/graphql/categoryQueries';
import { getLocalizedString as getCategoryLocalizedString } from '~/modules/category/utils/localization';
import { ProviderReviewsSection } from '~/modules/provider/components/ProviderReviewsSection';

const baseProviderSchema = z.object({
  businessName: z.object({
    en: z.string().min(1, { message: 'Business name (English) is required' }),
    mn: z.string().min(1, { message: 'Business name (Mongolian) is required' }),
  }),
  description: z
    .object({
      en: z.string().optional(),
      mn: z.string().optional(),
    })
    .optional(),
  location: z.object({
    address: z.object({
      en: z.string().min(1, { message: 'Address (English) is required' }),
      mn: z.string().min(1, { message: 'Address (Mongolian) is required' }),
    }),
    city: z.object({
      en: z.string().min(1, { message: 'City (English) is required' }),
      mn: z.string().min(1, { message: 'City (Mongolian) is required' }),
    }),
    district: z
      .object({
        en: z.string().optional(),
        mn: z.string().optional(),
      })
      .optional(),
    coordinates: z
      .object({
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
  }),
  contactInfo: z.object({
    phone: z.string().min(1, { message: 'Phone is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    website: z.string().optional(),
  }),
  facilities: z.array(z.string()).optional(),
  categoryIds: z
    .array(z.string())
    .min(1, { message: 'At least one category is required' }),
  singleProviderLimit: z.coerce
    .number()
    .int()
    .min(0, { message: 'Limit must be 0 or greater' })
    .optional(),
  isActive: z.boolean().optional(),
  icon: z.string().optional(),
  coverImages: z.array(z.string()).optional(),
});

const createProviderSchema = baseProviderSchema;
const editProviderSchema = baseProviderSchema.partial();

type CreateProviderFormData = z.infer<typeof createProviderSchema>;
type EditProviderFormData = z.infer<typeof editProviderSchema>;

interface ProviderDialogProps {
  mode: 'create' | 'edit';
  providerId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const ProviderDialog = ({
  mode,
  providerId,
  open,
  onOpenChange,
  onClose,
}: ProviderDialogProps) => {
  const isCreate = mode === 'create';
  const [internalOpen, setInternalOpen] = useState(false);
  const { uploadUrl, masterUrl, isSlaveMode } = useUploadConfig();

  const effectiveOpen = open !== undefined ? open : internalOpen;
  const effectiveOnOpenChange =
    onOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));

  if (isCreate) {
    return (
      <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Create Provider
          </Button>
        </Sheet.Trigger>
        <Sheet.View className="sm:max-w-2xl">
          <Sheet.Header>
            <Sheet.Title>Create Provider</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
          <ProviderForm
            mode="create"
            uploadurl={uploadUrl}
            masterUrl={masterUrl}
            isSlaveMode={isSlaveMode}
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
      <Sheet.View className="sm:max-w-2xl">
        <Sheet.Header>
          <Sheet.Title>Edit Provider</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ProviderForm
          mode="edit"
          providerId={providerId!}
          uploadurl={uploadUrl}
          masterUrl={masterUrl}
          isSlaveMode={isSlaveMode}
          onClose={() => {
            effectiveOnOpenChange(false);
            onClose?.();
          }}
        />
      </Sheet.View>
    </Sheet>
  );
};

interface ProviderFormProps {
  mode: 'create' | 'edit';
  providerId?: string;
  uploadurl?: string;
  masterUrl?: string;
  isSlaveMode?: boolean;
  onClose: () => void;
}

const ProviderForm = ({
  mode,
  providerId,
  uploadurl,
  masterUrl,
  isSlaveMode,
  onClose,
}: ProviderFormProps) => {
  const isCreate = mode === 'create';
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mn'>('en');
  const [showMap, setShowMap] = useState(false);

  const imageOptions = {
    isSlaveMode: isSlaveMode ?? false,
    masterUrl,
  };

  const { data: providerData, loading: queryLoading } = useQuery(
    ONE_FIT_PROVIDER,
    {
      variables: { _id: providerId },
      skip: isCreate || !providerId,
    },
  );

  const { data: categoriesData } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES, {
    variables: {},
  });

  const provider = providerData?.oneFitProvider;
  const categories = categoriesData?.oneFitActivityCategories || [];

  const getCategoryFullPath = (
    categoryId: string,
    categoriesList: Array<{
      _id: string;
      parentId?: string;
      name: { en: string; mn: string };
    }>,
  ): string => {
    const categoryMap = new Map(categoriesList.map((cat) => [cat._id, cat]));

    const getPath = (id: string, path: string[] = []): string[] => {
      const cat = categoryMap.get(id);
      if (!cat) return path;

      const currentName = getCategoryLocalizedString(cat.name, 'en');
      const newPath = [currentName, ...path];

      if (cat.parentId) {
        return getPath(cat.parentId, newPath);
      }

      return newPath;
    };

    const path = getPath(categoryId);
    return path.join(' > ');
  };

  const form = useForm<CreateProviderFormData | EditProviderFormData>({
    resolver: zodResolver(isCreate ? createProviderSchema : editProviderSchema),
    defaultValues: {
      businessName: {
        en: '',
        mn: '',
      },
      description: {
        en: '',
        mn: '',
      },
      location: {
        address: {
          en: '',
          mn: '',
        },
        city: {
          en: '',
          mn: '',
        },
        district: {
          en: '',
          mn: '',
        },
        coordinates: {
          lat: undefined,
          lng: undefined,
        },
      },
      contactInfo: {
        phone: '',
        email: '',
        website: '',
      },
      facilities: [],
      categoryIds: [],
      singleProviderLimit: 5,
      isActive: true,
      icon: '',
      coverImages: [],
    },
  });

  useEffect(() => {
    if (!isCreate && provider) {
      form.reset({
        businessName: provider.businessName || { en: '', mn: '' },
        description: provider.description || { en: '', mn: '' },
        location: {
          address: provider.location?.address || { en: '', mn: '' },
          city: provider.location?.city || { en: '', mn: '' },
          district: provider.location?.district || { en: '', mn: '' },
          coordinates: provider.location?.coordinates
            ? {
                lat: provider.location.coordinates.lat,
                lng: provider.location.coordinates.lng,
              }
            : {
                lat: undefined,
                lng: undefined,
              },
        },
        contactInfo: {
          phone: provider.contactInfo?.phone || '',
          email: provider.contactInfo?.email || '',
          website: provider.contactInfo?.website || '',
        },
        facilities: provider.facilities || [],
        categoryIds: provider.categoryIds || [],
        singleProviderLimit: provider.singleProviderLimit ?? 5,
        isActive: provider.isActive,
        icon: provider.icon || '',
        coverImages: provider.coverImages || [],
      });
      setSelectedLanguage('en');
    }
  }, [provider, isCreate, form]);

  const { createProvider, loading: createLoading } = useCreateProvider();
  const { updateProvider, loading: updateLoading } = useUpdateProvider();

  const loading = isCreate ? createLoading : updateLoading;
  const isRejected = !isCreate && provider?.status === ProviderStatus.REJECTED;

  const onSubmit = (data: CreateProviderFormData | EditProviderFormData) => {
    if (isRejected) {
      return;
    }

    const locationInput: any = {
      address: data.location!.address,
      city: data.location!.city,
    };
    if (
      data.location!.district &&
      (data.location!.district.en || data.location!.district.mn)
    ) {
      locationInput.district = data.location!.district;
    }
    if (
      data.location!.coordinates?.lat !== undefined &&
      data.location!.coordinates?.lng !== undefined
    ) {
      locationInput.coordinates = {
        lat: data.location!.coordinates.lat,
        lng: data.location!.coordinates.lng,
      };
    }

    const contactInfoInput: any = {
      phone: data.contactInfo!.phone,
      email: data.contactInfo!.email,
    };
    if (data.contactInfo!.website) {
      contactInfoInput.website = data.contactInfo!.website;
    }

    if (isCreate) {
      const createData = data as CreateProviderFormData;
      createProvider({
        variables: {
          businessName: createData.businessName,
          description:
            createData.description &&
            (createData.description.en || createData.description.mn)
              ? createData.description
              : undefined,
          location: locationInput,
          contactInfo: contactInfoInput,
          facilities:
            createData.facilities && createData.facilities.length > 0
              ? createData.facilities
              : undefined,
          categoryIds: createData.categoryIds,
          singleProviderLimit: createData.singleProviderLimit,
          isActive:
            createData.isActive !== undefined ? createData.isActive : true,
          icon: createData.icon || undefined,
          coverImages:
            createData.coverImages && createData.coverImages.length > 0
              ? createData.coverImages
              : undefined,
        },
        onCompleted: () => {
          onClose();
          form.reset();
        },
      });
    } else {
      const editData = data as EditProviderFormData;
      updateProvider({
        variables: {
          _id: providerId!,
          businessName: editData.businessName,
          description:
            editData.description &&
            (editData.description.en || editData.description.mn)
              ? editData.description
              : undefined,
          location: locationInput,
          contactInfo: contactInfoInput,
          facilities:
            editData.facilities && editData.facilities.length > 0
              ? editData.facilities
              : undefined,
          categoryIds: editData.categoryIds,
          singleProviderLimit: editData.singleProviderLimit,
          isActive: editData.isActive,
          icon: editData.icon || undefined,
          coverImages:
            editData.coverImages && editData.coverImages.length > 0
              ? editData.coverImages
              : undefined,
        },
        onCompleted: () => {
          onClose();
        },
      });
    }
  };

  if (!isCreate && queryLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-y-auto">
          <div className="flex flex-col gap-6 p-5">
            {isRejected && (
              <div className="text-destructive text-sm font-medium">
                Cannot edit a rejected provider
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pb-2">
              <Label className="text-sm font-medium">Language</Label>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="language-switch"
                  className={`text-sm ${
                    selectedLanguage === 'en'
                      ? 'font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  English
                </Label>
                <Switch
                  id="language-switch"
                  checked={selectedLanguage === 'mn'}
                  onCheckedChange={(checked) =>
                    setSelectedLanguage(checked ? 'mn' : 'en')
                  }
                  disabled={isRejected}
                />
                <Label
                  htmlFor="language-switch"
                  className={`text-sm ${
                    selectedLanguage === 'mn'
                      ? 'font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Mongolian
                </Label>
              </div>
            </div>
            <Form.Field
              control={form.control}
              name="businessName.en"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'en' ? 'hidden' : ''}
                >
                  <Form.Label>Business Name (English) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter business name in English"
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="businessName.mn"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'mn' ? 'hidden' : ''}
                >
                  <Form.Label>Business Name (Mongolian) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter business name in Mongolian"
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description.en"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'en' ? 'hidden' : ''}
                >
                  <Form.Label>Description (English)</Form.Label>
                  <Form.Control>
                    <Textarea
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter description in English"
                      rows={3}
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description.mn"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'mn' ? 'hidden' : ''}
                >
                  <Form.Label>Description (Mongolian)</Form.Label>
                  <Form.Control>
                    <Textarea
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter description in Mongolian"
                      rows={3}
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="space-y-4 border p-4 rounded-lg">
              <h3 className="font-semibold">Location</h3>
              <Form.Field
                control={form.control}
                name="location.address.en"
                render={({ field }) => (
                  <Form.Item
                    className={selectedLanguage !== 'en' ? 'hidden' : ''}
                  >
                    <Form.Label>Address (English) *</Form.Label>
                    <Form.Control>
                      <Input
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Enter address in English"
                        disabled={isRejected}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="location.address.mn"
                render={({ field }) => (
                  <Form.Item
                    className={selectedLanguage !== 'mn' ? 'hidden' : ''}
                  >
                    <Form.Label>Address (Mongolian) *</Form.Label>
                    <Form.Control>
                      <Input
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Enter address in Mongolian"
                        disabled={isRejected}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>City *</Form.Label>
                      <Form.Control>
                        <SelectCity
                          value={field.value}
                          onValueChange={field.onChange}
                          selectedLanguage={selectedLanguage}
                          placeholder="Select city..."
                          disabled={isRejected}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="location.district"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>District</Form.Label>
                      <Form.Control>
                        <SelectDistrict
                          value={field.value}
                          onValueChange={field.onChange}
                          cityValue={form.watch('location.city')}
                          selectedLanguage={selectedLanguage}
                          placeholder="Select district..."
                          disabled={isRejected}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="location.coordinates.lat"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Latitude</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          placeholder="Enter latitude"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          disabled={isRejected}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="location.coordinates.lng"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Longitude</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          placeholder="Enter longitude"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          disabled={isRejected}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap((prev) => !prev)}
                  disabled={isRejected}
                >
                  {showMap ? 'Hide map' : 'Show map'}
                </Button>
                {showMap && (
                  <ProviderLocationMap
                    coordinates={form.watch('location.coordinates')}
                    disabled={isRejected}
                    onSelect={(data) => {
                      form.setValue('location.coordinates', data.coordinates);
                    }}
                  />
                )}
              </div>
            </div>
            <div className="space-y-4 border p-4 rounded-lg">
              <h3 className="font-semibold">Contact Info</h3>
              <Form.Field
                control={form.control}
                name="contactInfo.phone"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Phone *</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder="Enter phone number"
                        disabled={isRejected}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="contactInfo.email"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Email *</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email"
                        disabled={isRejected}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="contactInfo.website"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Website</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder="Enter website URL"
                        disabled={isRejected}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>
            <Form.Field
              control={form.control}
              name="facilities"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Facilities (comma-separated)</Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Enter facilities separated by commas"
                      value={field.value?.join(', ') || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? e.target.value
                                .split(',')
                                .map((f) => f.trim())
                                .filter(Boolean)
                            : [],
                        )
                      }
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selectedCategoryIds = field.value || [];
                const selectedCategories = categories.filter(
                  (cat: {
                    _id: string;
                    parentId?: string;
                    name: { en: string; mn: string };
                  }) => selectedCategoryIds.includes(cat._id),
                );

                return (
                  <Form.Item>
                    <Form.Label>Categories *</Form.Label>
                    <Form.Control>
                      <SelectCategories
                        selected={selectedCategoryIds}
                        onSelect={field.onChange}
                        disabled={isRejected}
                      />
                    </Form.Control>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">
                          Selected Categories:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map(
                            (category: {
                              _id: string;
                              parentId?: string;
                              name: { en: string; mn: string };
                            }) => (
                              <span
                                key={category._id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                              >
                                {getCategoryFullPath(category._id, categories)}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    <Form.Message />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="singleProviderLimit"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Provider booking limit (30 days)</Form.Label>
                  <Form.Control>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Default: 5"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="icon"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Icon</Form.Label>
                  <Form.Control>
                    <OneFitUpload.Root
                      value={getImageReadUrl(field.value, imageOptions) || ''}
                      onChange={(fileInfo: { url?: string }) => {
                        if (fileInfo.url) {
                          const imageKey = extractImageKey(
                            fileInfo.url,
                            imageOptions,
                          );
                          field.onChange(imageKey);
                        }
                      }}
                      uploadUrl={uploadurl}
                    >
                      {field.value ? (
                        <div className="relative w-full">
                          <div className="flex justify-center items-center w-full min-h-28 p-4 rounded-md border bg-accent">
                            <OneFitUpload.Preview className="object-contain max-w-full max-h-32" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            className="absolute right-2 bottom-2 size-6"
                            onClick={() => {
                              field.onChange('');
                            }}
                            disabled={isRejected}
                          >
                            <IconTrash size={12} color="red" />
                          </Button>
                        </div>
                      ) : (
                        <OneFitUpload.Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          className="flex flex-col justify-center items-center w-full h-28 border border-dashed text-muted-foreground"
                          disabled={isRejected}
                        >
                          <IconUpload className="mb-2" />
                          {/* <Button
                            variant="outline"
                            className="text-sm font-medium"
                          > */}
                          Upload icon
                          {/* </Button> */}
                        </OneFitUpload.Button>
                      )}
                    </OneFitUpload.Root>
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="coverImages"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Cover Images</Form.Label>
                  <Form.Control>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {field.value?.map((imageKey, index) => (
                          <div key={index} className="relative group">
                            <div className="relative w-full aspect-video rounded-md border overflow-hidden bg-accent">
                              <img
                                src={getImageReadUrl(imageKey, imageOptions)}
                                alt={`Cover ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              type="button"
                              className="absolute top-2 right-2 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newImages = field.value?.filter(
                                  (_, i) => i !== index,
                                );
                                field.onChange(newImages || []);
                              }}
                              disabled={isRejected}
                            >
                              <IconX size={12} />
                            </Button>
                          </div>
                        ))}
                        <OneFitUpload.Root
                          value=""
                          onChange={(fileInfo: { url?: string }) => {
                            if (fileInfo.url) {
                              const imageKey = extractImageKey(
                                fileInfo.url,
                                imageOptions,
                              );
                              field.onChange([
                                ...(field.value || []),
                                imageKey,
                              ]);
                            }
                          }}
                          uploadUrl={uploadurl}
                        >
                          <OneFitUpload.Preview className="hidden" />
                          <OneFitUpload.Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            className="flex flex-col justify-center items-center w-full h-full min-h-28 border border-dashed text-muted-foreground aspect-video"
                            disabled={isRejected}
                          >
                            <IconPlus className="mb-2" />
                            <span className="text-sm font-medium">
                              Add image
                            </span>
                          </OneFitUpload.Button>
                        </OneFitUpload.Root>
                      </div>
                    </div>
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Form.Item className="flex flex-row items-center space-x-2 space-y-0">
                  <Form.Control>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isRejected}
                    />
                  </Form.Control>
                  <Form.Label variant="peer">Active</Form.Label>
                  <Form.Message />
                </Form.Item>
              )}
            />
            {!isCreate && providerId ? (
              <ProviderReviewsSection providerId={providerId} />
            ) : null}
          </div>
        </Sheet.Content>
        <Sheet.Footer>
          {!isCreate && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size={isCreate ? 'lg' : 'default'}
            disabled={loading || isRejected}
          >
            <Spinner show={loading} />
            {isCreate ? 'Create Provider' : 'Update Provider'}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

// Export convenience components for backward compatibility
export const CreateProviderDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <ProviderDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      onClose={() => setOpen(false)}
    />
  );
};

export const EditProviderDialog = ({
  providerId,
  open,
  onOpenChange,
  onClose,
}: {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) => (
  <ProviderDialog
    mode="edit"
    providerId={providerId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);

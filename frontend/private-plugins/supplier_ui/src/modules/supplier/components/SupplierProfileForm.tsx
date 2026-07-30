import { zodResolver } from '@hookform/resolvers/zod';
import {
  Badge,
  Button,
  Form,
  InfoCard,
  Input,
  Select,
  Textarea,
  toast,
} from 'erxes-ui';
import { IconHash } from '@tabler/icons-react';
import { useCallback, useEffect } from 'react';
import { Path, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ADDRESS_CITY, ADDRESS_DISTRICT } from '../constants/address';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { supplierProfileSchema } from '../constants/supplierProfileSchema';
import { useGetSupplier } from '../hooks/useSupplier';
import { useUpdateSupplier } from '../hooks/useUpdateSupplier';
import { SupplierEditorField } from './SupplierEditorField';
import { PaymentMethodField } from './PaymentMethodField';
import { SupplierPhones } from './SupplierPhones';
import { UploadImage } from './upload';
import { MultiUploadImage } from './MultiUploadImage';
import { UrlListField } from './UrlListField';

const statusVariant = (status?: string) => {
  switch (status) {
    case 'verified':
      return 'success' as const;
    case 'unverified':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

export const SupplierProfileForm = () => {
  const { supplier, loading } = useGetSupplier();
  const { updateSupplier, loading: saving } = useUpdateSupplier();

  const supplierAddress = supplier?.address as any;
  const addressDetails = supplierAddress?.details || supplierAddress?.address;
  const getDefaultValues = useCallback(() => {
    const fallbackSocialLinks = {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    } as z.infer<typeof supplierProfileSchema>['socialLinks'];

    return {
      name: supplier?.name || '',
      description: supplier?.description || '',
      about: supplier?.about || '',
      logo: supplier?.logo || '',
      coverImage: supplier?.coverImage || '',
      attachments: supplier?.attachments || [],
      urls: supplier?.urls || [],
      website: supplier?.website || '',
      registrationNumber: supplier?.registrationNumber || '',
      primaryEmail: supplier?.primaryEmail || '',
      primaryPhone: supplier?.primaryPhone || '',
      phones: supplier?.phones || [],
      dateFounded: supplier?.dateFounded || '',
      paymentId: supplier?.paymentId || '',
      address: {
        details: {
          countryCode: addressDetails?.countryCode || undefined,
          country: addressDetails?.country || undefined,
          postCode: addressDetails?.postCode || undefined,
          city: addressDetails?.city || undefined,
          city_district: addressDetails?.city_district || undefined,
          suburb: addressDetails?.suburb || undefined,
          road: addressDetails?.road || undefined,
          street: addressDetails?.street || undefined,
          building: addressDetails?.building || undefined,
          number: addressDetails?.number || undefined,
          other: addressDetails?.other || undefined,
        },
        location: supplierAddress?.location
          ? {
              type: supplierAddress?.location?.type || undefined,
              coordinates: supplierAddress?.location?.coordinates || undefined,
            }
          : undefined,
        short: supplierAddress?.short || undefined,
      },
      socialLinks: (supplier?.socialLinks as any) || fallbackSocialLinks,
    };
  }, [supplier, supplierAddress, addressDetails]);

  const form = useForm<z.infer<typeof supplierProfileSchema>>({
    resolver: zodResolver(supplierProfileSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (supplier) {
      form.reset(getDefaultValues());
    }
  }, [supplier, form, getDefaultValues]);

  const logo = form.watch('logo');
  const coverImage = form.watch('coverImage');
  const city = form.watch('address.details.city');

  const onSubmit = (values: z.infer<typeof supplierProfileSchema>) => {
    updateSupplier({
      variables: { input: values },
      onCompleted: () => {
        toast({ title: 'Saved', description: 'Profile updated' });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 mx-auto p-6 w-full max-w-6xl">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-lg">Supplier profile</h1>
        <div className="flex items-center gap-2">
          {supplier?.code && (
            <Badge variant="secondary" className="font-mono tracking-wide">
              <IconHash className="size-3.5 shrink-0 text-muted-foreground" />
              {supplier.code}
            </Badge>
          )}
          <Badge variant={statusVariant(supplier?.verificationStatus)}>
            {supplier?.verificationStatus || 'pending'}
          </Badge>
        </div>
      </div>
      {supplier?.verificationStatus === 'unverified' &&
        supplier?.verificationNote && (
          <div className="bg-destructive/10 px-4 py-3 border border-destructive/50 rounded-lg text-destructive text-sm">
            <p className="mb-1 font-medium">Profile rejected</p>
            <p>{supplier.verificationNote}</p>
          </div>
        )}

      <Form {...form}>
        <form
          className="gap-4 grid grid-cols-1 lg:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit, (error) => {
            console.log(error);
          })}
        >
          <InfoCard title="Branding">
            <InfoCard.Content>
              <div className="gap-4 grid grid-cols-2">
                <Form.Field
                  name="logo"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Logo</Form.Label>
                      <UploadImage
                        value={logo}
                        onValueChange={(value) => field.onChange(value)}
                        className="size-16"
                      />
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="coverImage"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item className="col-span-2">
                      <Form.Label>Cover Image</Form.Label>
                      <UploadImage
                        value={coverImage}
                        onValueChange={(value) => field.onChange(value)}
                        uploaderClassName="w-full"
                        className="w-full aspect-video"
                      />
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
            </InfoCard.Content>
          </InfoCard>

          <InfoCard title="Social Links">
            <InfoCard.Content>
              <div className="flex flex-col gap-2">
                {SOCIAL_LINKS.map((item: { label: string; value: string }) => (
                  <Form.Field
                    key={item.value}
                    name={
                      `socialLinks.${item.value}` as Path<
                        z.infer<typeof supplierProfileSchema>
                      >
                    }
                    control={form.control}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{item.label}</Form.Label>
                        <Form.Control>
                          <Input
                            value={(field.value as string) || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                ))}
              </div>
            </InfoCard.Content>
          </InfoCard>

          <InfoCard title="Basic information" className="lg:col-span-2">
            <InfoCard.Content>
              <div className="gap-4 grid grid-cols-2">
                <Form.Field
                  name="name"
                  control={form.control}
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
                  name="website"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Website</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="registrationNumber"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Registration Number</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="dateFounded"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Date Founded</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select date" />
                          </Select.Trigger>
                          <Select.Content>
                            {Array.from({ length: 100 }).map((_, index) => (
                              <Select.Item
                                key={index}
                                value={`${new Date().getFullYear() - index}`}
                              >{`${
                                new Date().getFullYear() - index
                              }`}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item className="col-span-2">
                      <Form.Label>Description</Form.Label>
                      <Form.Control>
                        <Textarea {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <div className="col-span-2">
                  <SupplierEditorField
                    control={form.control}
                    setValue={form.setValue}
                    name="about"
                    label="About"
                    initialContent={supplier?.about}
                  />
                </div>
              </div>
            </InfoCard.Content>
          </InfoCard>

          <InfoCard title="Address">
            <InfoCard.Content>
              <div className="gap-4 grid grid-cols-2">
                <Form.Field
                  name="address.details.city"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>City</Form.Label>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('address.details.city_district', '');
                        }}
                      >
                        <Form.Control>
                          <Select.Trigger>
                            <Select.Value placeholder="Select city" />
                          </Select.Trigger>
                        </Form.Control>
                        <Select.Content>
                          {ADDRESS_CITY.map((city) => (
                            <Select.Item key={city} value={city}>
                              {city}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="address.details.city_district"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>District</Form.Label>
                      <Select
                        key={city}
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!city}
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="Select district" />
                        </Select.Trigger>
                        <Select.Content>
                          {ADDRESS_DISTRICT[
                            city as keyof typeof ADDRESS_DISTRICT
                          ]?.map((district) => (
                            <Select.Item
                              key={district.value}
                              value={district.value}
                            >
                              {district.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  name="address.short"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item className="col-span-2">
                      <Form.Label>Address</Form.Label>
                      <Form.Control>
                        <Textarea {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
            </InfoCard.Content>
          </InfoCard>

          <div className="flex flex-col gap-4">
            <InfoCard title="Contact">
              <InfoCard.Content>
                <div className="gap-4 grid grid-cols-2">
                  <Form.Field
                    name="primaryEmail"
                    control={form.control}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Email</Form.Label>
                        <Form.Control>
                          <Input type="email" {...field} />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    name="primaryPhone"
                    control={form.control}
                    render={() => (
                      <Form.Item>
                        <Form.Label>Phone</Form.Label>
                        <SupplierPhones form={form} />
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </InfoCard.Content>
            </InfoCard>

            <PaymentMethodField control={form.control} />
          </div>

          <InfoCard title="Attachments" className="lg:col-span-2">
            <InfoCard.Content>
              <div className="flex flex-col gap-4">
                <Form.Field
                  name="attachments"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Images</Form.Label>
                      <MultiUploadImage
                        value={(field.value as string[]) || []}
                        onValueChange={field.onChange}
                        disabled={saving}
                      />
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
            </InfoCard.Content>
          </InfoCard>

          <Button
            type="submit"
            className="lg:col-span-2 mt-2"
            disabled={saving || !form.formState.isDirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

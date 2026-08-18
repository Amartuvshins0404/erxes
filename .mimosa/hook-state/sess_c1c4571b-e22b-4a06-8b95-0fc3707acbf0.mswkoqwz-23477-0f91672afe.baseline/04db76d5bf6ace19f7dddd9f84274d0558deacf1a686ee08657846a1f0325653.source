import { developerInfoSchema } from '@/block/constants/developerInfoSchema';
import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { useUpdateDeveloperInfo } from '@/block/hooks/useUpdateDeveloperInfo';
import { ADDRESS_CITY, ADDRESS_DISTRICT } from '@/project/constants/address';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, Select, Textarea, toast } from 'erxes-ui';
import { useCallback, useEffect } from 'react';
import { Path, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { BlockEditorField } from './BlockEditor';
import { BlockPhones } from './BlockPhones';
import { UploadImage } from './upload';

export const BlockDeveloperInfo = () => {
  const { developerInfo, loading } = useDeveloperInfo();

  return (
    <div className="p-6 mx-auto w-full max-w-lg flex flex-col gap-6">
      <h1 className="text-lg font-bold mb-4">Developer Info</h1>
      {!loading && developerInfo && (
        <BlockDeveloperInfoForm developerInfo={developerInfo} />
      )}
    </div>
  );
};

export const BlockDeveloperInfoForm = ({
  developerInfo,
}: {
  developerInfo: z.infer<typeof developerInfoSchema>;
}) => {
  const { address } = developerInfo || {};
  const getDefaultValues = useCallback(() => {
    return {
      name: developerInfo.name || '',
      description: developerInfo.description || '',
      logo: developerInfo.logo || '',
      coverImage: developerInfo.coverImage || '',
      website: developerInfo.website || '',
      registrationNumber: developerInfo.registrationNumber || '',
      primaryEmail: developerInfo.primaryEmail || '',
      primaryPhone: developerInfo.primaryPhone || '',
      phones: developerInfo.phones || [],
      dateFounded: developerInfo.dateFounded || '',
      about: developerInfo.about || '',
      address: {
        address: {
          countryCode: address?.address?.countryCode || undefined,
          country: address?.address?.country || undefined,
          postCode: address?.address?.postCode || undefined,
          city: address?.address?.city || undefined,
          city_district: address?.address?.city_district || undefined,
          suburb: address?.address?.suburb || undefined,
          road: address?.address?.road || undefined,
          street: address?.address?.street || undefined,
          building: address?.address?.building || undefined,
          number: address?.address?.number || undefined,
          other: address?.address?.other || undefined,
        },
        location: {
          type: address?.location?.type || undefined,
          coordinates: address?.location?.coordinates || undefined,
        },
        short: address?.short || undefined,
      },
      socialLinks:
        developerInfo.socialLinks ||
        ({
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        } as z.infer<typeof developerInfoSchema>['socialLinks']),
    };
  }, [developerInfo]);

  const form = useForm<z.infer<typeof developerInfoSchema>>({
    resolver: zodResolver(developerInfoSchema),
    defaultValues: getDefaultValues(),
  });
  const { updateDeveloperInfo } = useUpdateDeveloperInfo();

  const logo = form.watch('logo');
  const coverImage = form.watch('coverImage');

  useEffect(() => {
    if (developerInfo) {
      form.reset(getDefaultValues());
    }
  }, [developerInfo, form, getDefaultValues]);

  const onSubmit = (data: z.infer<typeof developerInfoSchema>) => {
    updateDeveloperInfo({
      variables: {
        input: data,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Developer info updated successfully',
        });
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

  return (
    <Form {...form}>
      <form
        className="gap-4 grid grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit, (error) => {
          console.log(error);
        })}
      >
        <Form.Field
          name="logo"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Logo</Form.Label>
              <UploadImage
                value={logo}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
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
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                uploaderClassName="w-full"
                className="w-full aspect-video"
              />
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          name="name"
          control={form.control}
          render={({ field }) => (
            <Form.Item className="col-start-1">
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
          name="primaryEmail"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Email</Form.Label>
              <Form.Control>
                <Input {...field} />
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
              <BlockPhones form={form} />
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select date" />
                  </Select.Trigger>
                  <Select.Content>
                    {Array.from({ length: 100 }).map((_, index) => (
                      <Select.Item
                        value={`${new Date().getFullYear() - index}`}
                      >{`${new Date().getFullYear() - index}`}</Select.Item>
                    ))}
                  </Select.Content>
                </Select>
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
          name="description"
          control={form.control}
          render={({ field }) => (
            <Form.Item className="col-span-2">
              <Form.Label>Description</Form.Label>
              <Form.Control>
                <Textarea {...field} />
              </Form.Control>
              <Form.Description>
                A quick summary meant to grab attention and explain what the
                developer company
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
        <BlockEditorField
          control={form.control}
          setValue={form.setValue}
          name="about"
          label="About"
          initialContent={developerInfo.about}
        />
        <Form.Field
          name="address.address.city"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>City</Form.Label>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('address.address.city', value);
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
        <SelectAddressDistrict form={form} />
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
        <div className="col-span-2 flex flex-col gap-2">
          {SOCIAL_LINKS.map((item: { label: string; value: string }) => (
            <Form.Field
              key={item.value}
              name={
                `socialLinks.${item.value}` as Path<
                  z.infer<typeof developerInfoSchema>
                >
              }
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{item.label}</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value as string}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          ))}
        </div>
        <Button
          type="submit"
          className="mt-2"
          disabled={!form.formState.isDirty}
        >
          Save
        </Button>
      </form>
    </Form>
  );
};

export const SelectAddressDistrict = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof developerInfoSchema>>;
}) => {
  const city = form.watch('address.address.city');
  return (
    <Form.Field
      name="address.address.city_district"
      control={form.control}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>District</Form.Label>
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={!city}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select district" />
            </Select.Trigger>
            <Select.Content>
              {ADDRESS_DISTRICT[city as keyof typeof ADDRESS_DISTRICT]?.map(
                (district) => (
                  <Select.Item key={district.value} value={district.value}>
                    {district.label}
                  </Select.Item>
                ),
              )}
            </Select.Content>
          </Select>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

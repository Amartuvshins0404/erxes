import { ADDRESS_CITY, ADDRESS_DISTRICT } from '@/block/constants/address';
import { developerInfoSchema } from '@/block/constants/developerInfoSchema';
import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { DeveloperDetailActions } from '@/developer/components/DeveloperDetailActions';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Select, Textarea } from 'erxes-ui';
import { useCallback, useEffect } from 'react';
import { Path, useForm, UseFormReturn } from 'react-hook-form';
import { useParams } from 'react-router';
import { z } from 'zod';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { BlockEditorField } from './BlockEditor';
import { BlockPhones } from './BlockPhones';
import { UploadImage } from './upload';

export const BlockDeveloperInfo = () => {
  const { id } = useParams();

  const { developerInfo, loading } = useDeveloperInfo(id);

  return (
    <div className="flex flex-col gap-6 mx-auto p-6 w-full max-w-lg">
      <h1 className="mb-4 font-bold text-lg">Developer Info</h1>
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

  useEffect(() => {
    if (developerInfo) {
      form.reset(getDefaultValues());
    }
  }, [developerInfo, form, getDefaultValues]);

  return (
    <Form {...form}>
      <form className="gap-4 grid grid-cols-2">
        <div className="flex justify-between items-center col-span-2">
          <Form.Field
            name="logo"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Logo</Form.Label>
                <UploadImage value={field.value} className="size-16" />
                <Form.Message />
              </Form.Item>
            )}
          />
          <DeveloperDetailActions />
        </div>

        <Form.Field
          name="coverImage"
          control={form.control}
          render={({ field }) => (
            <Form.Item className="col-span-2">
              <Form.Label>Cover Image</Form.Label>
              <UploadImage
                value={field.value}
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
                <Input value={field.value as string} />
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
                <Input value={field.value as string} />
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
                <Input value={field.value as string} />
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
                <Select value={field.value}>
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
                <Input value={field.value as string} />
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
                <Textarea value={field.value as string} />
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
              <Select value={field.value}>
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
                <Textarea value={field.value as string} />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <div className="flex flex-col gap-2 col-span-2">
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
                    <Input value={field.value as string} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          ))}
        </div>
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

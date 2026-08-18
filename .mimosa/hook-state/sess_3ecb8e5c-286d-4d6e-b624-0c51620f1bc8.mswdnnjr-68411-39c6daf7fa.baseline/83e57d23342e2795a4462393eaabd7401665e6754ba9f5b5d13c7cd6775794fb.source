import { useCompanyInfo } from '@/btk/hooks/useCompanyInfo';
import { VerificationStatusBadge } from './BtkCompanyCard';
import { UploadImage } from './upload';
import { Button, Form, Input, Select, Textarea, toast } from 'erxes-ui';
import { Path, useForm, UseFormReturn } from 'react-hook-form';
import { companyInfoSchema } from '@/btk/constants/companyInfoSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ADDRESS_CITY,
  ADDRESS_DISTRICT,
} from '~/modules/news/constants/address';
import { useCallback, useEffect } from 'react';
import { useUpdateCompanyInfo } from '@/btk/hooks/useUpdateCompanyInfo';
import { BtkEditorField } from './BtkEditor';
import { BtkPhones } from './BtkPhones';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { useParams } from 'react-router-dom';

export const BtkCompanyInfo = () => {
  const { id } = useParams();
  const { companyInfo, loading } = useCompanyInfo(id || '');

  return (
    <div className="p-6 mx-auto w-full max-w-lg flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Company info</h1>
        {companyInfo && (
          <VerificationStatusBadge status={companyInfo.verificationStatus} />
        )}
      </div>
      {!loading && companyInfo && (
        <BtkCompanyInfoForm companyInfo={companyInfo} />
      )}
    </div>
  );
};

export const BtkCompanyInfoForm = ({
  companyInfo,
  isCreate = false,
  onClose,
}: {
  companyInfo: z.infer<typeof companyInfoSchema>;
  isCreate?: boolean;
  onClose?: () => void;
}) => {
  const getDefaultValues = useCallback(() => {
    return {
      name: companyInfo.name || '',
      description: companyInfo.description || '',
      logo: companyInfo.logo || '',
      coverImage: companyInfo.coverImage || '',
      website: companyInfo.website || '',
      email: companyInfo.email || '',
      primaryPhone: companyInfo.primaryPhone || '',
      phones: companyInfo.phones || [],
      dateFounded: companyInfo.dateFounded || '',
      about: companyInfo.about || '',
      address: {
        city: companyInfo.address?.city || ADDRESS_CITY[0],
        district: companyInfo.address?.district || '',
        address: companyInfo.address?.address || '',
      },
      socialLinks: companyInfo.socialLinks || {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        youtube: '',
      },
    };
  }, [companyInfo]);

  const form = useForm<z.infer<typeof companyInfoSchema>>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: getDefaultValues(),
  });

  const { updateCompanyInfo } = useUpdateCompanyInfo();

  useEffect(() => {
    if (companyInfo) {
      form.reset(getDefaultValues());
    }
  }, [companyInfo, form, getDefaultValues]);

  const onSubmit = (data: z.infer<typeof companyInfoSchema>) => {
    updateCompanyInfo({
      variables: {
        id: companyInfo._id || '',
        input: data,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: isCreate
            ? 'Company created successfully'
            : 'Company info updated successfully',
        });
        if (isCreate) onClose?.();
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

  const isSubmitDisabled = isCreate ? false : !form.formState.isDirty;

  return (
    <Form {...form}>
      <form
        className="gap-4 grid grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Form.Field
          name="logo"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Logo</Form.Label>
              <UploadImage
                value={field.value}
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
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
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
          name="email"
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
              <BtkPhones form={form} />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          name="dateFounded"
          control={form.control}
          render={({ field }) => {
            const dateStr = field.value?.split('T')[0] || '';
            const parts = dateStr.split('-');
            const year = parts[0] || '';
            const month = parts[1] ? String(parseInt(parts[1])) : '';
            const day = parts[2] ? String(parseInt(parts[2])) : '';
            const daysInMonth =
              year && month
                ? new Date(parseInt(year), parseInt(month), 0).getDate()
                : 31;
            return (
              <Form.Item className="col-span-2">
                <Form.Label>Date Founded</Form.Label>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <Select value={year} onValueChange={(y) => field.onChange(y)}>
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Он" />
                      </Select.Trigger>
                      <Select.Content>
                        {Array.from({ length: 100 }).map((_, i) => {
                          const y = `${new Date().getFullYear() - i}`;
                          return <Select.Item key={y} value={y}>{y}</Select.Item>;
                        })}
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={month}
                      onValueChange={(m) => field.onChange(`${year}-${m.padStart(2, '0')}`)}
                      disabled={!year}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Сар" />
                      </Select.Trigger>
                      <Select.Content>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Select.Item key={i + 1} value={`${i + 1}`}>
                            {i + 1}-р сар
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={day}
                      onValueChange={(d) =>
                        field.onChange(
                          `${year}-${month.padStart(2, '0')}-${d.padStart(2, '0')}`,
                        )
                      }
                      disabled={!month}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Өдөр" />
                      </Select.Trigger>
                      <Select.Content>
                        {Array.from({ length: daysInMonth }).map((_, i) => (
                          <Select.Item key={i + 1} value={`${i + 1}`}>
                            {i + 1}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                </div>
                <Form.Message />
              </Form.Item>
            );
          }}
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
                company does
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />

        <BtkEditorField
          control={form.control}
          setValue={form.setValue}
          name="about"
          label="About"
          initialContent={companyInfo.about}
        />

        <Form.Field
          name="address.city"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>City</Form.Label>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('address.district', '');
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
          name="address.address"
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
                  z.infer<typeof companyInfoSchema>
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

        <div className="col-span-2 flex gap-2 justify-end">
          {isCreate && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitDisabled}>
            {isCreate ? 'Create Company' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export const SelectAddressDistrict = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof companyInfoSchema>>;
}) => {
  const city = form.watch('address.city');
  return (
    <Form.Field
      name="address.district"
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

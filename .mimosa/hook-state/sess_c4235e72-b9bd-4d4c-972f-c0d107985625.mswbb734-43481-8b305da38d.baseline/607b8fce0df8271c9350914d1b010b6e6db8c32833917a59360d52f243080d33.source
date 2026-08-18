import { companyInfoSchema } from '@/btk/constants/companyInfoSchema';
import { useCompanyInfo } from '@/btk/hooks/useCompanyInfo';
import { useUpdateCompanyInfo } from '@/btk/hooks/useUpdateCompanyInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';
import { Button, Form, Input, Select, Textarea, toast } from 'erxes-ui';
import { useCallback, useEffect } from 'react';
import { Path, useForm, UseFormReturn } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  ADDRESS_CITY,
  ADDRESS_DISTRICT,
} from '~/modules/news/constants/address';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { BtkEditorField } from './BtkEditor';
import { BtkPhones } from './BtkPhones';
import { UploadImage } from './upload';
import { VerificationStatusBadge } from './BtkCompanyCard';
import {
  BTK_UPDATE_COMPANY_VERIFICATION_STATUS,
} from '@/btk/graphql/btkMutations';
import { BTK_GET_COMPANY_INFO } from '@/btk/graphql/btkQueries';

const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Шалгаж байна' },
  { value: 'need_info', label: 'Нэмэлт мэдээлэл хэрэгтэй' },
  { value: 'approved', label: 'Зөвшөөрөгдсөн' },
  { value: 'rejected', label: 'Зөвшөөрөгдөөгүй' },
  { value: 'violation', label: 'Дүрэм зөрчсөн' },
];

const BtkCompanyVerificationStatus = ({
  adminId,
  verificationStatus,
}: {
  adminId: string;
  verificationStatus?: string;
}) => {
  const [updateStatus, { loading }] = useMutation(
    BTK_UPDATE_COMPANY_VERIFICATION_STATUS,
    {
      refetchQueries: [
        { query: BTK_GET_COMPANY_INFO, variables: { _id: adminId } },
      ],
    },
  );

  const handleChange = (value: string) => {
    updateStatus({
      variables: { _id: adminId, verificationStatus: value },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  return (
    <div className="flex items-center gap-3 p-4 border rounded-xl bg-accent">
      <span className="text-sm font-medium text-muted-foreground">Статус:</span>
      <VerificationStatusBadge status={verificationStatus} />
      <div className="ml-auto">
        <Select value={verificationStatus} onValueChange={handleChange} disabled={loading}>
          <Select.Trigger className="w-52">
            <Select.Value placeholder="Статус сонгох" />
          </Select.Trigger>
          <Select.Content>
            {VERIFICATION_STATUSES.map((s) => (
              <Select.Item key={s.value} value={s.value}>
                {s.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </div>
  );
};

export const BtkCompanyInfo = () => {
  const { id } = useParams();
  const { companyInfo, loading } = useCompanyInfo(id || '');

  return (
    <div className="p-6 mx-auto w-full max-w-lg flex flex-col gap-6">
      <h1 className="text-lg font-bold">Developer Info</h1>
      {!loading && companyInfo && (
        <>
          <BtkCompanyVerificationStatus
            adminId={id || ''}
            verificationStatus={companyInfo.verificationStatus}
          />
          <BtkCompanyInfoForm companyInfo={companyInfo} />
        </>
      )}
    </div>
  );
};

export const BtkCompanyInfoForm = ({
  companyInfo,
}: {
  companyInfo: z.infer<typeof companyInfoSchema> & { _id?: string; entityId?: string };
}) => {
  const getDefaultValues = useCallback(() => {
    return {
      name: companyInfo?.name || '',
      description: companyInfo?.description || '',
      logo: companyInfo?.logo || '',
      coverImage: companyInfo?.coverImage || '',
      website: companyInfo?.website || '',
      email: companyInfo?.email || '',
      primaryPhone: companyInfo?.primaryPhone || '',
      phones: companyInfo?.phones || [],
      dateFounded: companyInfo?.dateFounded || '',
      about: companyInfo?.about || '',
      address: {
        city: companyInfo?.address?.city || ADDRESS_CITY[0],
        district: companyInfo?.address?.district || '',
        address: companyInfo?.address?.address || '',
      },
      socialLinks:
        companyInfo?.socialLinks ||
        ({
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        } as z.infer<typeof companyInfoSchema>['socialLinks']),
    };
  }, [companyInfo]);

  const form = useForm<z.infer<typeof companyInfoSchema>>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: getDefaultValues(),
  });
  const { updateCompanyInfo } = useUpdateCompanyInfo(companyInfo._id);

  useEffect(() => {
    if (companyInfo) {
      form.reset(getDefaultValues());
    }
  }, [companyInfo, form, getDefaultValues]);

  const onSubmit = (data: z.infer<typeof companyInfoSchema>) => {
    const { _id: _, ...input } = data;
    updateCompanyInfo({
      variables: {
        _id: companyInfo.entityId,
        input,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Company info updated successfully',
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
                company company
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
          initialContent={companyInfo?.about}
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
          <Button type="submit" disabled={!form.formState.isDirty}>
            Save
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

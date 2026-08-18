import { Form, InfoCard } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { agencyIdentitySchema } from '../schema/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AgencyIdentityValues } from '../types/form';
import { UploadImage } from '../form/upload';

export const AgencyProfileIdentity = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <AgencyIdentity />
    </div>
  );
};

export const AgencyIdentity = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyIdentityValues>({
    resolver: zodResolver(agencyIdentitySchema),
    mode: 'onBlur',
    defaultValues: {
      logo: agencyInfo?.logo || '',
      coverImage: agencyInfo?.coverImage || '',
    },
  });
  const { updateAgency } = useUpdateAgency();

  const handleSave = (patch: Partial<AgencyIdentityValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-3">
        <InfoCard title="Agency Information" description="Agency information">
          <InfoCard.Content>
            <Form.Field<AgencyIdentityValues, 'logo'>
              name="logo"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Logo</Form.Label>
                  <UploadImage
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSave({ logo: value });
                    }}
                    uploaderClassName="w-full"
                    className="w-full aspect-video"
                  />
                  <Form.Message />
                </Form.Item>
              )}
            />
          </InfoCard.Content>
        </InfoCard>
        <InfoCard title="Agency Information" description="Agency information">
          <InfoCard.Content>
            <Form.Field<AgencyIdentityValues, 'coverImage'>
              name="coverImage"
              control={form.control}
              render={({ field }) => (
                <Form.Item className="col-span-2">
                  <Form.Label>Cover Image</Form.Label>
                  <UploadImage
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSave({ coverImage: value });
                    }}
                    uploaderClassName="w-full"
                    className="w-full aspect-video"
                  />
                  <Form.Message />
                </Form.Item>
              )}
            />
          </InfoCard.Content>
        </InfoCard>
      </form>
    </Form>
  );
};

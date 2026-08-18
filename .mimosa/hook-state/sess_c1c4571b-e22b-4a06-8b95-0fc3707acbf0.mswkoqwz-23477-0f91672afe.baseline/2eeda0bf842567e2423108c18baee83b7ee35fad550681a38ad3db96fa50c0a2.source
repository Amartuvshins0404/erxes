import { Form, InfoCard, Textarea } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyIntroductionValues } from '../types/form';
import { agencyIntroductionSchema } from '../schema/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateAgency } from '../hooks/useUpdateAgency';

export const AgencyProfileIntroduction = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Introduction"
        description="Brief introduction about the agency"
      >
        <InfoCard.Content>
          <AgencyIntroduction />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyIntroduction = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyIntroductionValues>({
    resolver: zodResolver(agencyIntroductionSchema),
    mode: 'onBlur',
    defaultValues: {
      brief: agencyInfo?.brief || '',
      description: agencyInfo?.description || '',
    },
  });
  const { updateAgency } = useUpdateAgency();

  const handleSave = (patch: Partial<AgencyIntroductionValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="gap-1">
        <Form.Field<AgencyIntroductionValues, 'brief'>
          control={form.control}
          name="brief"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Brief Info</Form.Label>
              <Form.Control>
                <Textarea
                  maxLength={300}
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ brief: event.currentTarget.value });
                  }}
                  placeholder="Max 300 characters…"
                />
              </Form.Control>
              <Form.Description className="text-right">
                {(field.value as string)?.length}/300 characters
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyIntroductionValues, 'description'>
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Full Description</Form.Label>
              <Form.Control>
                <Textarea
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ brief: event.currentTarget.value });
                  }}
                  placeholder="Full agency description"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};

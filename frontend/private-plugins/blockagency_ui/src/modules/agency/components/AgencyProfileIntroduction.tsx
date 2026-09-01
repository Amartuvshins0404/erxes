import { Editor, Form, InfoCard } from 'erxes-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { agencyIntroductionSchema } from '../schema/form';
import { AgencyIntroductionValues } from '../types/form';
import { BRIEF_MAX_LENGTH } from '../schema/form';
import { getBlockPlainText } from '../utils/blockText';

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

  const briefLength = getBlockPlainText(form.watch('brief')).length;

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
                <Editor
                  initialContent={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    handleSave({ brief: value });
                  }}
                />
              </Form.Control>
              <Form.Description className="text-right">
                {briefLength}/{BRIEF_MAX_LENGTH} characters
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
                <Editor
                  className="h-64 min-h-64"
                  initialContent={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    handleSave({ description: value });
                  }}
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

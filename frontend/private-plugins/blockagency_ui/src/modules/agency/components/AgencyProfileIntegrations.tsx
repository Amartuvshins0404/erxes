import { Form, InfoCard, Input } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyIntegrationsValues } from '../types/form';
import { agencyIntegrationsSchema } from '../schema/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import React from 'react';

export const AgencyProfileIntegrations = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Frontline Integrations"
        description="Connect your erxes messenger widget to this agency"
      >
        <InfoCard.Content>
          <AgencyIntegrationsInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyIntegrationsInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyIntegrationsValues>({
    resolver: zodResolver(agencyIntegrationsSchema),
    mode: 'onBlur',
    defaultValues: {
      messengerIntegrationId: agencyInfo?.messengerIntegrationId || '',
      widgetBundleUrl: agencyInfo?.widgetBundleUrl || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      messengerIntegrationId: agencyInfo?.messengerIntegrationId || '',
      widgetBundleUrl: agencyInfo?.widgetBundleUrl || '',
    });
  }, [agencyInfo]);

  const { updateAgency } = useUpdateAgency();

  const handleSave = (patch: Partial<AgencyIntegrationsValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-3">
        <Form.Field<AgencyIntegrationsValues, 'messengerIntegrationId'>
          control={form.control}
          name="messengerIntegrationId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Erxes Messenger Integration Id</Form.Label>
              <Form.Control>
                <Input
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({
                      messengerIntegrationId: event.currentTarget.value,
                    });
                  }}
                  placeholder="e.g. 64f1c2e2b1a2c3d4e5f6a7b8"
                />
              </Form.Control>
              <Form.Description>
                The integration id of the erxes messenger connected to this
                agency's account.
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyIntegrationsValues, 'widgetBundleUrl'>
          control={form.control}
          name="widgetBundleUrl"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Widget Bundle Url</Form.Label>
              <Form.Control>
                <Input
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ widgetBundleUrl: event.currentTarget.value });
                  }}
                  placeholder="https://example.com/widgets/build/widgetsBundle.js"
                />
              </Form.Control>
              <Form.Description>
                The bundle url used to embed the messenger widget on the
                agency's website.
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};

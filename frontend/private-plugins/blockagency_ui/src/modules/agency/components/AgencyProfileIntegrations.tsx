import { Form, InfoCard, Skeleton } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyIntegrationsValues } from '../types/form';
import { agencyIntegrationsSchema } from '../schema/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { useRemoteComponent } from '../hooks/useRemoteComponent';
import React from 'react';

interface IEMSelectValue {
  integrationId: string;
  widgetBundleUrl: string;
}

interface SelectErxesMessengerProps {
  value?: string;
  onValueChange: (value: IEMSelectValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

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

  const {
    Component: SelectErxesMessenger,
    loading: remoteLoading,
    error,
  } = useRemoteComponent<SelectErxesMessengerProps>(
    'frontline_ui',
    'selectErxesMessenger',
  );

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
            <Form.Item className="col-span-2">
              <Form.Label>Erxes Messenger</Form.Label>
              <Form.Control>
                {SelectErxesMessenger ? (
                  <SelectErxesMessenger
                    value={field.value}
                    onValueChange={({ integrationId, widgetBundleUrl }) => {
                      field.onChange(integrationId);
                      form.setValue('widgetBundleUrl', widgetBundleUrl);
                      handleSave({
                        messengerIntegrationId: integrationId,
                        widgetBundleUrl,
                      });
                    }}
                    placeholder="Select erxes messenger integration"
                  />
                ) : error ? (
                  <div className="flex h-9 items-center rounded-md border border-destructive/50 px-3 text-sm text-destructive">
                    Frontline plugin is unavailable
                  </div>
                ) : (
                  <Skeleton className="h-9 w-full" />
                )}
              </Form.Control>
              <Form.Description>
                {error
                  ? 'Enable and start the frontline plugin to connect an erxes messenger integration.'
                  : remoteLoading
                    ? 'Loading erxes messenger integrations…'
                    : "The erxes messenger integration connected to this agency's account. Selecting one also sets its widget bundle url."}
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};

import { AiAgentProviderLogo } from '@/automations/components/settings/components/agents/components/AiAgentProviderLogo';
import { AI_AGENT_PROVIDER_DEFAULT_MODELS } from '@/automations/components/settings/components/agents/constants/providers';
import {
  getConnectionProvider,
  isConnectionSharedWithAutomations,
  TAiAgentConnectionOption,
} from '@/automations/components/settings/components/agents/hooks/useAiAgentConnections';
import { TAiAgentForm } from '@/automations/components/settings/components/agents/states/AiAgentFormSchema';
import { Form, Select } from 'erxes-ui';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const AiAgentConnectionSelect = ({
  connections,
}: {
  connections: TAiAgentConnectionOption[];
}) => {
  const { t } = useTranslation('automations');
  const { control, getValues, setValue } = useFormContext<TAiAgentForm>();

  const handleChange = (connectionId: string) => {
    const previous = connections.find(
      ({ _id }) => _id === getValues('connection.connectionId'),
    );
    const next = connections.find(({ _id }) => _id === connectionId);
    const nextProvider = getConnectionProvider(next);

    setValue('connection.connectionId', connectionId, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (
      nextProvider &&
      (!getValues('connection.model') || previous?.type !== next?.type)
    ) {
      setValue(
        'connection.model',
        AI_AGENT_PROVIDER_DEFAULT_MODELS[nextProvider],
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  return (
    <Form.Field
      control={control}
      name="connection.connectionId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('settings-agents-connection')}</Form.Label>
          <Form.Control>
            <Select value={field.value} onValueChange={handleChange}>
              <Select.Trigger>
                <Select.Value
                  placeholder={t('settings-agents-connection-select')}
                />
              </Select.Trigger>
              <Select.Content>
                {connections.map((connection) => (
                  <Select.Item
                    key={connection._id}
                    value={connection._id}
                    disabled={!isConnectionSharedWithAutomations(connection)}
                  >
                    <span className="flex items-center gap-2">
                      <AiAgentProviderLogo provider={connection.type} />
                      {connection.name}
                      {!isConnectionSharedWithAutomations(connection) && (
                        <span className="text-xs text-muted-foreground">
                          {t('settings-agents-connection-not-shared')}
                        </span>
                      )}
                    </span>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </Form.Control>
          <Form.Description>
            {t('settings-agents-connection-description')}
          </Form.Description>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

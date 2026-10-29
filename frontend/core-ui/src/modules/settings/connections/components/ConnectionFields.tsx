import { Form, Input, MultipleSelector, Select } from 'erxes-ui';
import type { MultiSelectOption } from 'erxes-ui';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type {
  IConnection,
  IConnectionFormValues,
  IConnectionType,
  TConnectionScope,
} from '../types';
import { getFieldKind } from '../utils/connectionForm';
import { HeadersEditor } from './HeadersEditor';
import { SecretFieldInput } from './SecretFieldInput';

interface IConnectionFieldsProps {
  type: IConnectionType;
  connection?: IConnection;
  canManage: boolean;
  services: string[];
}

export const ConnectionFields = ({
  type,
  connection,
  canManage,
  services,
}: IConnectionFieldsProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const form = useFormContext<IConnectionFormValues>();
  const scope = form.watch('scope');

  const serviceOptions = useMemo<MultiSelectOption[]>(
    () =>
      Array.from(
        new Set([
          ...services,
          ...type.defaultServices,
          ...(connection?.services ?? []),
        ]),
      ).map((service) => ({ value: service, label: service })),
    [services, type.defaultServices, connection],
  );

  return (
    <div className="flex flex-col gap-4">
      <Form.Field
        control={form.control}
        name="name"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('name', 'Name')} *</Form.Label>
            <Form.Control>
              <Input
                {...field}
                placeholder={t('name-placeholder', 'My {{type}}', {
                  type: type.label,
                })}
                autoComplete="off"
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={form.control}
        name="scope"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('scope', 'Available to')}</Form.Label>
            <Select
              value={field.value}
              onValueChange={(value) =>
                field.onChange(value as TConnectionScope)
              }
              disabled={Boolean(connection)}
            >
              <Form.Control>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
              </Form.Control>
              <Select.Content>
                <Select.Item value="personal">
                  {t('scope-personal', 'Only me (Personal)')}
                </Select.Item>
                <Select.Item value="workspace" disabled={!canManage}>
                  {canManage
                    ? t(
                        'scope-workspace',
                        'Everyone in the workspace (Workspace)',
                      )
                    : t(
                        'scope-workspace-denied',
                        'Workspace (requires connections manage permission)',
                      )}
                </Select.Item>
              </Select.Content>
            </Select>
            <Form.Message />
          </Form.Item>
        )}
      />

      {type.fields.map((field) => {
        const kind = getFieldKind(field);

        if (field.secret) {
          return (
            <SecretFieldInput
              key={field.name}
              field={field}
              stored={connection?.secretsSet.includes(field.name) ?? false}
              unreadable={
                connection?.secretsUnreadable.includes(field.name) ?? false
              }
            />
          );
        }

        if (kind === 'headers') {
          return (
            <div key={field.name} className="flex flex-col gap-2">
              <Form.Label>{field.label}</Form.Label>
              <HeadersEditor name={field.name} />
              {field.description && (
                <Form.Description>{field.description}</Form.Description>
              )}
            </div>
          );
        }

        return (
          <Form.Field
            key={field.name}
            control={form.control}
            name={`fields.${field.name}`}
            render={({ field: input }) => (
              <Form.Item>
                <Form.Label>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Form.Label>
                {kind === 'select' ? (
                  <Select value={input.value} onValueChange={input.onChange}>
                    <Form.Control>
                      <Select.Trigger>
                        <Select.Value
                          placeholder={field.placeholder ?? field.label}
                        />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      {(field.options ?? []).map((option) => (
                        <Select.Item key={option} value={option}>
                          {option}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                ) : (
                  <Form.Control>
                    <Input
                      {...input}
                      type={kind === 'url' ? 'url' : 'text'}
                      placeholder={field.placeholder ?? ''}
                      autoComplete="off"
                    />
                  </Form.Control>
                )}
                {field.description && (
                  <Form.Description>{field.description}</Form.Description>
                )}
                <Form.Message />
              </Form.Item>
            )}
          />
        );
      })}

      {scope === 'workspace' && (
        <Form.Field
          control={form.control}
          name="services"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t('shared-with', 'Shared with')}</Form.Label>
              <Form.Control>
                <MultipleSelector
                  options={serviceOptions}
                  value={field.value.map((service) => ({
                    value: service,
                    label: service,
                  }))}
                  onChange={(options) =>
                    field.onChange(options.map((option) => option.value))
                  }
                  disabled={!canManage}
                  placeholder={t('shared-with-placeholder', 'Select services')}
                  emptyIndicator={t('no-services', 'No services available')}
                />
              </Form.Control>
              <Form.Description>
                {t(
                  'shared-with-description',
                  'Services that may use this connection. Core always can.',
                )}
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
      )}
    </div>
  );
};

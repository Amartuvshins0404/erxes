import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button, Form, Input } from 'erxes-ui';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IConnectionField, IConnectionFormValues } from '../types';

interface ISecretFieldInputProps {
  field: IConnectionField;
  stored: boolean;
  unreadable: boolean;
}

export const SecretFieldInput = ({
  field,
  stored,
  unreadable,
}: ISecretFieldInputProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const form = useFormContext<IConnectionFormValues>();
  const [visible, setVisible] = useState(false);
  const cleared = form.watch(`cleared.${field.name}`) === true;
  const keepsStored = stored && !cleared;

  const placeholder = keepsStored
    ? t('secret-stored', 'Stored — leave blank to keep')
    : unreadable
    ? t('secret-reenter', 'Cannot be read — enter it again')
    : field.placeholder ?? '';

  return (
    <Form.Field
      control={form.control}
      name={`fields.${field.name}`}
      render={({ field: input }) => (
        <Form.Item>
          <Form.Label>
            {field.label}
            {field.required ? ' *' : ''}
          </Form.Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Form.Control>
                <Input
                  {...input}
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-10"
                  placeholder={placeholder}
                />
              </Form.Control>
              <div className="absolute inset-y-0 right-1 flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setVisible((current) => !current)}
                  aria-label={
                    visible
                      ? t('hide-secret', 'Hide value')
                      : t('show-secret', 'Show value')
                  }
                  aria-pressed={visible}
                >
                  {visible ? (
                    <IconEyeOff className="size-3.5" />
                  ) : (
                    <IconEye className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {(stored || unreadable) && !cleared && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue(`fields.${field.name}`, '', {
                    shouldDirty: true,
                  });
                  form.setValue(`cleared.${field.name}`, true, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                {t('clear-secret', 'Clear')}
              </Button>
            )}
            {cleared && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  form.setValue(`cleared.${field.name}`, false, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {t('undo-clear', 'Undo')}
              </Button>
            )}
          </div>
          {cleared && (
            <p className="text-xs text-destructive">
              {t('secret-will-clear', 'The stored value is removed on save.')}
            </p>
          )}
          {unreadable && !cleared && (
            <p className="text-xs text-destructive">
              {t(
                'secret-unreadable',
                'The stored value can no longer be opened. Enter it again.',
              )}
            </p>
          )}
          {field.description && (
            <Form.Description>{field.description}</Form.Description>
          )}
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

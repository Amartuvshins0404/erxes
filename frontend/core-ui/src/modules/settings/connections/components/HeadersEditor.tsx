import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Form, Input } from 'erxes-ui';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IConnectionFormValues } from '../types';

interface IHeadersEditorProps {
  name: string;
}

export const HeadersEditor = ({ name }: IHeadersEditorProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });
  const form = useFormContext<IConnectionFormValues>();
  const path = `headers.${name}` as const;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: path,
  });

  return (
    <div className="flex flex-col gap-2">
      {fields.map((row, index) => (
        <div key={row.id} className="flex items-start gap-2">
          <Form.Field
            control={form.control}
            name={`${path}.${index}.key`}
            render={({ field }) => (
              <Form.Item className="flex-1">
                <Form.Control>
                  <Input
                    {...field}
                    placeholder={t('header-name', 'Header name')}
                    aria-label={t('header-name', 'Header name')}
                    autoComplete="off"
                  />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name={`${path}.${index}.value`}
            render={({ field }) => (
              <Form.Item className="flex-1">
                <Form.Control>
                  <Input
                    {...field}
                    placeholder={t('header-value', 'Value')}
                    aria-label={t('header-value', 'Value')}
                    autoComplete="off"
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}
            aria-label={t('remove-header', 'Remove header')}
          >
            <IconTrash />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append({ key: '', value: '' })}
      >
        <IconPlus />
        {t('add-header', 'Add header')}
      </Button>
    </div>
  );
};

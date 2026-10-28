import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import {
  BOARD_NAMES_CONFIGS,
  BOARD_NUMBERS,
  PIPELINE_ACCESS_ALL,
  PIPELINE_ACCESS_SCOPES,
} from '@/deals/constants/pipelines';
import type { TPipelineForm } from '@/deals/types/pipelines';
import { Checkbox, Form, Input, Select } from 'erxes-ui';
import { SelectMember } from 'ui-modules';
import Attribution from './Attribution';
import { useTranslation } from 'react-i18next';

const PIPELINE_ACCESS_OPTIONS = [
  { value: PIPELINE_ACCESS_ALL, label: 'pipeline-access-all' },
  { value: PIPELINE_ACCESS_SCOPES[0], label: 'show-only-user-assigned-deal' },
  {
    value: PIPELINE_ACCESS_SCOPES[1],
    label: 'show-only-user-assigned-deal-by-structure',
  },
];

const PipelineConfig = ({ form }: { form: UseFormReturn<TPipelineForm> }) => {
  const { control } = form;
  const accessScope = useWatch({ control, name: 'accessRule.scope' });

  const { t } = useTranslation('sales');

  return (
    <>
      <div className="flex flex-wrap gap-4 justify-between mb-4">
        <Form.Field
          control={control}
          name="numberConfig"
          render={({ field }) => (
            <Form.Item className="flex-1">
              <div className="flex justify-between items-center">
                <Form.Label>{t('number-configuration')}</Form.Label>
                <Attribution
                  config={BOARD_NUMBERS}
                  onChange={field.onChange}
                  value={field.value || ''}
                />
              </div>
              <Form.Control>
                <Input
                  {...field}
                  placeholder={t('enter-number-configuration')}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={control}
          name="numberSize"
          render={({ field }) => (
            <Form.Item className="w-48">
              <Form.Label>{t('fractional-part')}</Form.Label>
              <Form.Control>
                <Input {...field} placeholder="1-8" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </div>

      <Form.Field
        control={control}
        name="nameConfig"
        render={({ field }) => (
          <Form.Item>
            <div className="flex justify-between items-center">
              <Form.Label>{t('name-configuration')}</Form.Label>
              <Attribution
                config={BOARD_NAMES_CONFIGS}
                onChange={field.onChange}
                value={field.value || ''}
              />
            </div>
            <Form.Control>
              <Input {...field} placeholder={t('enter-name-configuration')} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={control}
        name="isCheckDate"
        render={({ field }) => (
          <Form.Item className="flex flex-1 gap-3 items-center mt-4">
            <Form.Label>{t('Select-day-after-card-created')}</Form.Label>
            <Form.Control>
              <Checkbox
                className="mt-0!"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={control}
        name="accessRule.scope"
        render={({ field }) => (
          <Form.Item className="my-2">
            <Form.Label>{t('pipeline-deal-access')}</Form.Label>
            <Form.Control>
              <Select
                value={field.value ?? PIPELINE_ACCESS_ALL}
                onValueChange={(value) =>
                  field.onChange(
                    PIPELINE_ACCESS_SCOPES.find((scope) => scope === value) ??
                      null,
                  )
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {PIPELINE_ACCESS_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {t(option.label)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      {accessScope && (
        <Form.Field
          control={control}
          name="accessRule.exemptUserIds"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t('user-see-all-deals')}</Form.Label>
              <SelectMember.FormItem
                mode="multiple"
                value={field.value}
                onValueChange={field.onChange}
              />
            </Form.Item>
          )}
        />
      )}
    </>
  );
};

export default PipelineConfig;

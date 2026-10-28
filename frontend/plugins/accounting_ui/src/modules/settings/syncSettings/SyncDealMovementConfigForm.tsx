import { useTranslation } from 'react-i18next';
import { SelectAccount } from '@/settings/account/components/SelectAccount';
import { JournalEnum } from '@/settings/account/types/Account';
import { TR_STATUSES } from '@/transactions/types/constants';
import { Form, Select } from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import { SelectStructureEntities } from 'ui-modules';
import { STOCK_PLACE_CAPABILITY } from '@/utils/structure';
import { z } from 'zod';
import {
  SyncConfigFormFooter,
  SyncConfigGeneralFields,
  SyncConfigPipelineSection,
  usePipelineReset,
} from './SyncConfigFormSections';
import { SyncSettingSection } from './SyncSettingSection';
import { useEffect } from 'react';

export const syncDealMovementConfigFormSchema = z.object({
  title: z.string(),
  boardId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string(),
  responseFieldId: z.string().optional(),
  dateRule: z.enum(['alwaysNow', 'syncedDateOrNow']),
  trStatus: z.string().optional(),
  sourceAccountId: z.string(),
  destinationAccountId: z.string(),
  defaultSourcePlaceEntityId: z.string().optional(),
  defaultDestinationPlaceEntityId: z.string().optional(),
  dealLocationSide: z.enum(['source', 'destination']),
});

type ConfigFormValues = z.infer<typeof syncDealMovementConfigFormSchema>;

const InventoryAccountField = ({
  form,
  name,
  label,
}: {
  form: UseFormReturn<ConfigFormValues>;
  name: 'sourceAccountId' | 'destinationAccountId';
  label: string;
}) => {
  return (
    <Form.Field
      control={form.control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{label}</Form.Label>
          <Form.Control>
            <SelectAccount.FormItem
              value={field.value}
              onValueChange={field.onChange}
              defaultFilter={{ journals: [JournalEnum.INVENTORY] }}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

const PlaceField = ({
  form,
  name,
  label,
}: {
  form: UseFormReturn<ConfigFormValues>;
  name: 'defaultSourcePlaceEntityId' | 'defaultDestinationPlaceEntityId';
  label: string;
}) => {
  return (
    <Form.Field
      control={form.control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{label}</Form.Label>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="single"
              capability={STOCK_PLACE_CAPABILITY}
              value={field.value ?? ''}
              onValueChange={field.onChange}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

const DealLocationSideField = ({
  form,
}: {
  form: UseFormReturn<ConfigFormValues>;
}) => {
  const { t } = useTranslation('accounting');
  return (
    <Form.Field
      control={form.control}
      name="dealLocationSide"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>
            {t('side-using-the-deal-place', 'Side using the deal place')}
          </Form.Label>
          <Form.Control>
            <Select
              value={field.value}
              onValueChange={(value) =>
                field.onChange(value as ConfigFormValues['dealLocationSide'])
              }
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="source">{t('source-side')}</Select.Item>
                <Select.Item value="destination">
                  {t('destination-side')}
                </Select.Item>
              </Select.Content>
            </Select>
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const SyncDealMovementConfigForm = ({
  form,
  onSubmit,
  loading,
}: {
  form: UseFormReturn<ConfigFormValues>;
  onSubmit: (data: ConfigFormValues) => void;
  loading: boolean;
}) => {
  const { t } = useTranslation('accounting');
  const { boardId, pipelineId } = usePipelineReset(form);

  useEffect(() => {
    if (!form.getValues('trStatus')) {
      form.setValue('trStatus', TR_STATUSES.COMPLETE);
    }
    if (!form.getValues('dealLocationSide')) {
      form.setValue('dealLocationSide', 'source');
    }
  }, [form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1 min-h-0 bg-background"
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          <SyncSettingSection title={t('general')}>
            <SyncConfigGeneralFields control={form.control} />
          </SyncSettingSection>

          <SyncConfigPipelineSection
            boardId={boardId}
            pipelineId={pipelineId}
            form={form}
          />

          <SyncSettingSection title={t('account')}>
            <InventoryAccountField
              form={form}
              name="sourceAccountId"
              label={t('source-inventory-account')}
            />
            <InventoryAccountField
              form={form}
              name="destinationAccountId"
              label={t('destination-inventory-account')}
            />
          </SyncSettingSection>

          <SyncSettingSection title={t('default-source-location')}>
            <PlaceField
              form={form}
              name="defaultSourcePlaceEntityId"
              label={t('source-place', 'Source place')}
            />
          </SyncSettingSection>

          <SyncSettingSection title={t('default-destination-location')}>
            <PlaceField
              form={form}
              name="defaultDestinationPlaceEntityId"
              label={t('destination-place', 'Destination place')}
            />
            <DealLocationSideField form={form} />
          </SyncSettingSection>
        </div>
        <SyncConfigFormFooter loading={loading} />
      </form>
    </Form>
  );
};

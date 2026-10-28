import { useTranslation } from 'react-i18next';
import { SelectAccount } from '@/settings/account/components/SelectAccount';
import { IAccount } from '@/settings/account/types/Account';
import { CurrencyField, Form, Input, Select } from 'erxes-ui';
import { useWatch } from 'react-hook-form';
import { SelectMember, SelectStructureEntities } from 'ui-modules';
import { ICommonFieldProps } from '../types/JournalForms';

export const AccountField = ({
  form,
  index,
  detIndex,
  filter,
  allDetails,
  labelTxt,
  onAccountChange,
}: ICommonFieldProps & {
  filter?: any;
  allDetails?: boolean;
  onAccountChange?: (account: IAccount) => void;
}) => {
  const { t } = useTranslation('accounting');
  const details = useWatch({
    control: form.control,
    name: `trDocs.${index}.details`,
  }) as unknown[];
  const onChangeAccount = (account: IAccount) => {
    if (allDetails) {
      details.forEach((_d, ind) => {
        form.setValue(`trDocs.${index}.details.${ind}.account`, account as any);
        form.setValue(
          `trDocs.${index}.details.${ind}.accountId`,
          account._id as any,
        );
      });
    } else {
      form.setValue(
        `trDocs.${index}.details.${detIndex ?? 0}.account`,
        account as any,
      );
    }

    if (account?.placeEntityId) {
      form.setValue(`trDocs.${index}.placeEntityId`, account.placeEntityId);
    }

    if (account?.responsibleEntityId) {
      form.setValue(
        `trDocs.${index}.responsibleEntityId`,
        account.responsibleEntityId,
      );
    }

    onAccountChange?.(account);
  };

  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.details.${detIndex ?? 0}.accountId`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{labelTxt ? t(labelTxt) : t('account')}</Form.Label>
          <Form.Control>
            <SelectAccount
              value={field.value || ''}
              onValueChange={field.onChange}
              onCallback={onChangeAccount}
              defaultFilter={{ ...filter, permissionMode: 'write' }}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const SideField = ({
  form,
  index,
  sides,
  labelTxt,
}: ICommonFieldProps & {
  sides: {
    label: string;
    value: string;
  }[];
}) => {
  const { t } = useTranslation('accounting');
  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.side`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{labelTxt ? t(labelTxt) : t('side')}</Form.Label>
          <Select value={field.value} onValueChange={field.onChange}>
            <Form.Control>
              <Select.Trigger className="h-8">
                <Select.Value />
              </Select.Trigger>
            </Form.Control>
            <Select.Content>
              {sides.map((side) => (
                <Select.Item key={side.value} value={side.value}>
                  {t(side.label || '', { nsSeparator: false })}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </Form.Item>
      )}
    />
  );
};

export const AmountField = ({
  form,
  index,
  detIndex,
  labelTxt,
  onAmountChange,
}: ICommonFieldProps & {
  onAmountChange?: (value: number) => void;
}) => {
  const { t } = useTranslation('accounting');
  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.details.${detIndex ?? 0}.amount`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{labelTxt ? t(labelTxt) : t('amount')}</Form.Label>
          <Form.Control>
            <CurrencyField.ValueInput
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                onAmountChange?.(value || 0);
              }}
            />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};

export const AssignToField = ({ form, index, labelTxt }: ICommonFieldProps) => {
  const { t } = useTranslation('accounting');
  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.assignedUserIds`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{labelTxt ? t(labelTxt) : t('assigned-to')}</Form.Label>
          <Form.Control>
            <SelectMember.FormItem
              onValueChange={(users) => field.onChange(users || [])}
              value={field.value}
              mode="multiple"
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const PlaceField = ({
  form,
  index,
  labelTxt,
  capability,
}: ICommonFieldProps & { capability?: string }) => {
  const { t } = useTranslation('accounting');
  const details = useWatch({
    control: form.control,
    name: `trDocs.${index}.details`,
  }) as unknown[];

  const onChangePlace = (placeEntityId: string[] | string | undefined) => {
    form.setValue(`trDocs.${index}.placeEntityId`, placeEntityId as string);
    details.forEach((_d, ind) => {
      form.setValue(
        `trDocs.${index}.details.${ind}.placeEntityId`,
        placeEntityId as string,
      );
    });
  };

  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.placeEntityId`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>
            {labelTxt ? t(labelTxt) : t('place', 'Place')}
          </Form.Label>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="single"
              capability={capability}
              value={field.value ?? ''}
              onValueChange={onChangePlace}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const ResponsibleField = ({
  form,
  index,
  labelTxt,
}: ICommonFieldProps) => {
  const { t } = useTranslation('accounting');
  const details = useWatch({
    control: form.control,
    name: `trDocs.${index}.details`,
  }) as unknown[];

  const onChangeResponsible = (
    responsibleEntityId: string[] | string | undefined,
  ) => {
    form.setValue(
      `trDocs.${index}.responsibleEntityId`,
      responsibleEntityId as string,
    );
    details.forEach((_d, ind) => {
      form.setValue(
        `trDocs.${index}.details.${ind}.responsibleEntityId`,
        responsibleEntityId as string,
      );
    });
  };

  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.responsibleEntityId`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>
            {labelTxt ? t(labelTxt) : t('responsible', 'Responsible')}
          </Form.Label>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="single"
              value={field.value ?? ''}
              onValueChange={onChangeResponsible}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const DescriptionField = ({
  form,
  index,
  labelTxt,
}: ICommonFieldProps) => {
  const { t } = useTranslation('accounting');
  return (
    <Form.Field
      control={form.control}
      name={`trDocs.${index}.description`}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{labelTxt ? t(labelTxt) : t('description')}</Form.Label>
          <Form.Control>
            <Input {...field} value={field.value ?? ''} />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const BankField = ({ form, index }: ICommonFieldProps) => {
  const { t } = useTranslation('accounting');
  return (
    <>
      <Form.Field
        control={form.control}
        name={`trDocs.${index}.extraData.bank`}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('bank-label')}</Form.Label>
            <Form.Control>
              <Input
                placeholder={t('enter-bank-name')}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={form.control}
        name={`trDocs.${index}.extraData.bankAccount`}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('bank-account')}</Form.Label>
            <Form.Control>
              <Input
                placeholder={t('enter-bank-account-number')}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
    </>
  );
};

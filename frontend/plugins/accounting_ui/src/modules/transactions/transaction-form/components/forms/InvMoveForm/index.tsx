import { STOCK_PLACE_CAPABILITY } from '@/utils/structure';
import { useTranslation } from 'react-i18next';
import { SelectAccount } from '@/settings/account/components/SelectAccount';
import { IAccount, JournalEnum } from '@/settings/account/types/Account';
import { Form } from 'erxes-ui';
import { SelectStructureEntities } from 'ui-modules';
import { ITransactionGroupForm } from '../../../types/JournalForms';
import {
  AccountField,
  AssignToField,
  PlaceField,
  ResponsibleField,
  DescriptionField,
} from '../../GeneralFormFields';
import { CustomerFields } from '../../helpers/CustomerFields';
import { RelAccountsForm } from '../../helpers/RelAccountsForm';
import { InventoryForm } from './InventoryForm';

export const InvMoveForm = ({
  form,
  index,
}: {
  form: ITransactionGroupForm;
  index: number;
}) => {
  const { t } = useTranslation('accounting');
  const onChangeInAccount = (account: IAccount) => {
    form.setValue(`trDocs.${index}.followExtras.moveInAccount`, account as any);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <AccountField
          form={form}
          index={index}
          filter={{ journals: [JournalEnum.INVENTORY] }}
          allDetails={true}
          labelTxt="source-inventory-account"
        />
        <CustomerFields form={form} index={index} />
        <PlaceField
          form={form}
          index={index}
          capability={STOCK_PLACE_CAPABILITY}
        />
        <ResponsibleField form={form} index={index} />
        <AssignToField form={form} index={index} />
        <DescriptionField form={form} index={index} />
        <Form.Field
          control={form.control}
          name={`trDocs.${index}.followInfos.moveInAccountId`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t('destination-inventory-account')}</Form.Label>
              <Form.Control>
                <SelectAccount
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  defaultFilter={{
                    journals: [JournalEnum.INVENTORY],
                    permissionMode: 'write',
                  }}
                  onCallback={(account) => onChangeInAccount(account)}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name={`trDocs.${index}.followInfos.moveInPlaceEntityId`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t('destination-place', 'Destination place')}
              </Form.Label>
              <Form.Control>
                <SelectStructureEntities.FormItem
                  mode="single"
                  capability={STOCK_PLACE_CAPABILITY}
                  value={field.value ?? ''}
                  onValueChange={(entityId) => field.onChange(entityId)}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name={`trDocs.${index}.followInfos.moveInResponsibleEntityId`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t('destination-responsible', 'Destination responsible')}
              </Form.Label>
              <Form.Control>
                <SelectStructureEntities.FormItem
                  mode="single"
                  value={field.value ?? ''}
                  onValueChange={(entityId) => field.onChange(entityId)}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </div>

      <div className="pt-3">
        <RelAccountsForm form={form} index={index} />
      </div>

      <InventoryForm form={form} journalIndex={index} />
    </>
  );
};

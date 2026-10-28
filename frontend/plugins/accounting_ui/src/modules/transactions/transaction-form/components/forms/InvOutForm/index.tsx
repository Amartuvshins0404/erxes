import { STOCK_PLACE_CAPABILITY } from '@/utils/structure';
import { JournalEnum } from '@/settings/account/types/Account';
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

export const InvOutForm = ({
  form,
  index,
}: {
  form: ITransactionGroupForm;
  index: number;
}) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <AccountField
          form={form}
          index={index}
          filter={{ journals: [JournalEnum.INVENTORY] }}
          allDetails={true}
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
      </div>

      <div className="pt-3">
        <RelAccountsForm form={form} index={index} />
      </div>

      <InventoryForm form={form} journalIndex={index} />
    </>
  );
};

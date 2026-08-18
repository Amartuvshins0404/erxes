import {
  Combobox,
  type IPhoneFieldProps,
  PhoneDisplay,
  PhoneField,
  PopoverScoped,
  RecordTableInlineCell,
  ValidationStatus,
} from 'erxes-ui';

interface AgencyPhonesProps {
  _id: string;
  primaryPhone: string;
  phones: string[];
  phoneValidationStatus?: `${ValidationStatus}`;
  scope?: string;
  onValueChange?: (values: IPhoneFieldProps) => void;
  disabled?: boolean;
}

export function AgencyPhones({
  _id,
  primaryPhone,
  phones,
  phoneValidationStatus,
  scope,
  onValueChange,
  disabled = false,
}: AgencyPhonesProps) {
  const phoneProps = {
    primaryPhone,
    phones,
    phoneValidationStatus: phoneValidationStatus as ValidationStatus,
  };

  return (
    <PopoverScoped scope={scope || ''} modal>
      <Combobox.Trigger disabled={disabled}>
        <PhoneDisplay {...phoneProps} />
      </Combobox.Trigger>
      <RecordTableInlineCell.Content className="w-72">
        <PhoneField
          recordId={_id}
          {...phoneProps}
          onValueChange={onValueChange as (values: IPhoneFieldProps) => void}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
}

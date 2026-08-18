import {
  Combobox,
  type IPhoneFieldProps,
  PhoneDisplay,
  PhoneField,
  PopoverScoped,
  RecordTableInlineCell,
  toast,
  ValidationStatus,
} from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import { companyInfoSchema } from '../constants/companyInfoSchema';
import { z } from 'zod';

interface BtkPhonesProps {
  form: UseFormReturn<z.infer<typeof companyInfoSchema>>;
}

export function BtkPhones({ form }: BtkPhonesProps) {
  const [primaryPhone, phones] = form.watch(['primaryPhone', 'phones']);

  const phoneProps = {
    primaryPhone: primaryPhone || '',
    phones: phones || ([] as string[]),
    phoneValidationStatus: ValidationStatus.Valid,
  };

  const handleValueChange = (values: IPhoneFieldProps) => {
    form.setValue('primaryPhone', values.primaryPhone, { shouldDirty: true });
    form.setValue('phones', values.phones || [], { shouldDirty: true });
  };

  const handleValidationStatusChange = () => {
    toast({
      title: 'Coming soon',
      description: 'This feature is coming soon',
    });
  };

  return (
    <PopoverScoped>
      <Combobox.Trigger>
        <PhoneDisplay {...phoneProps} />
      </Combobox.Trigger>
      <RecordTableInlineCell.Content className="w-72">
        <PhoneField
          recordId={''}
          {...phoneProps}
          onValueChange={handleValueChange}
          onValidationStatusChange={handleValidationStatusChange}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
}

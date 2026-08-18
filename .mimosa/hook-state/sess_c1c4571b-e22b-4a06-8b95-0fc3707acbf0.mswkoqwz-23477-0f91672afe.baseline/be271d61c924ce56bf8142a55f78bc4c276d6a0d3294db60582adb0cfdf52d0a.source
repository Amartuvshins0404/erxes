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
import { z } from 'zod';
import { supplierProfileSchema } from '../constants/supplierProfileSchema';

interface SupplierPhonesProps {
  form: UseFormReturn<z.infer<typeof supplierProfileSchema>>;
}

export function SupplierPhones({ form }: SupplierPhonesProps) {
  const [primaryPhone, phones] = form.watch(['primaryPhone', 'phones']);

  const phoneProps = {
    primaryPhone: primaryPhone || '',
    phones: phones || ([] as string[]),
    phoneValidationStatus: ValidationStatus.Valid,
  };

  const handleValueChange = (values: IPhoneFieldProps) => {
    form.setValue('primaryPhone', values.primaryPhone ?? '', {
      shouldDirty: true,
    });
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
          recordId=""
          {...phoneProps}
          onValueChange={handleValueChange}
          onValidationStatusChange={handleValidationStatusChange}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
}


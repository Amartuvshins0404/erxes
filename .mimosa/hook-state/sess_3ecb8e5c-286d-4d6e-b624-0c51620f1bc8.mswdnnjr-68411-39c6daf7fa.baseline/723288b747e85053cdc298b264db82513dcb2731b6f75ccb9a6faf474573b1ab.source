import {
  Combobox,
  PhoneDisplay,
  PhoneField,
  PopoverScoped,
  RecordTableInlineCell,
  toast,
  ValidationStatus,
} from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { developerInfoSchema } from '../constants/developerInfoSchema';

interface BlockPhonesProps {
  form: UseFormReturn<z.infer<typeof developerInfoSchema>>;
}

export function BlockPhones({ form }: BlockPhonesProps) {
  const [primaryPhone, phones] = form.watch(['primaryPhone', 'phones']);

  const phoneProps = {
    primaryPhone: primaryPhone || '',
    phones: phones || ([] as string[]),
    phoneValidationStatus: ValidationStatus.Valid,
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
          onValueChange={() => {}}
          onValidationStatusChange={handleValidationStatusChange}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
}

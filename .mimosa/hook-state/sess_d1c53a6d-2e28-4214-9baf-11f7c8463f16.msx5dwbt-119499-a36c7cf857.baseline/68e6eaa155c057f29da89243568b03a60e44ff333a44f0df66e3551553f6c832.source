import {
  Combobox,
  EmailDisplay,
  EmailListField,
  PopoverScoped,
  RecordTableInlineCell,
  TEmailsOnValueChange,
  ValidationStatus,
} from 'erxes-ui';

interface CustomerEmailsProps {
  primaryEmail: string;
  _id: string;
  emailValidationStatus?: `${ValidationStatus}`;
  emails: string[];
  scope?: string;
  onValueChange?: TEmailsOnValueChange;
  disabled?: boolean;
}

export function AgencyEmails({
  primaryEmail,
  _id,
  emailValidationStatus,
  emails,
  scope,
  onValueChange,
  disabled = false,
}: CustomerEmailsProps) {
  const emailProps = {
    primaryEmail,
    emails,
    emailValidationStatus: emailValidationStatus as ValidationStatus,
  };

  return (
    <PopoverScoped scope={scope || ''} modal>
      <Combobox.Trigger disabled={disabled}>
        <EmailDisplay {...emailProps} />
      </Combobox.Trigger>
      <RecordTableInlineCell.Content className="w-72">
        <EmailListField
          recordId={_id}
          {...emailProps}
          onValueChange={onValueChange as TEmailsOnValueChange}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
}

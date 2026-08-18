export type RegistrationFieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'checkbox_group'
  | 'file'
  | 'file_list';

export interface RegistrationFieldOption {
  value: string;
  label: string;
}

export interface RegistrationFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface RegistrationFieldUi {
  columns?: number;
  placeholder?: string;
  helpText?: string;
}

export interface RegistrationField {
  id: string;
  kind: RegistrationFieldKind;
  label: string;
  required?: boolean;
  acknowledgment?: boolean;
  validation?: RegistrationFieldValidation;
  options?: RegistrationFieldOption[];
  ui?: RegistrationFieldUi;
}

export interface RegistrationSection {
  id: string;
  title?: string;
  description?: string;
  fields: RegistrationField[];
}

export interface RegistrationFormDefinition {
  membershipTypeId: string;
  schemaVersion: string;
  title: string;
  description?: string;
  sections: RegistrationSection[];
}

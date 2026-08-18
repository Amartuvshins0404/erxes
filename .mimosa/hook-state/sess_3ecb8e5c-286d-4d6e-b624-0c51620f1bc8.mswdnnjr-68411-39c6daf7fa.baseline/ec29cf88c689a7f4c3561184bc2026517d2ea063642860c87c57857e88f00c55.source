import { RegistrationField } from '@/registration/types/registrationForm';

export function isAnswerEmpty(
  field: RegistrationField,
  value: unknown,
): boolean {
  if (field.kind === 'boolean') {
    if (value === undefined || value === null) return true;
    if (field.required && field.acknowledgment) return value !== true;
    return false;
  }
  if (value === undefined || value === null) return true;
  if (value === '') return true;
  if (
    field.kind === 'checkbox_group' ||
    field.kind === 'multiselect' ||
    field.kind === 'file_list'
  ) {
    return !Array.isArray(value) || value.length === 0;
  }
  return false;
}

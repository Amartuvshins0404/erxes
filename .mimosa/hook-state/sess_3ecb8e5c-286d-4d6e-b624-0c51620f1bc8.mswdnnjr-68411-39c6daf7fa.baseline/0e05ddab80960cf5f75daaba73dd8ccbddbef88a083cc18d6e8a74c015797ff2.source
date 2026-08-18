import { RegistrationFormDefinition } from '@/registration/types/registrationForm';

export function isFormDefinition(
  value: unknown,
): value is RegistrationFormDefinition {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.membershipTypeId === 'string' &&
    typeof o.schemaVersion === 'string' &&
    typeof o.title === 'string' &&
    Array.isArray(o.sections)
  );
}

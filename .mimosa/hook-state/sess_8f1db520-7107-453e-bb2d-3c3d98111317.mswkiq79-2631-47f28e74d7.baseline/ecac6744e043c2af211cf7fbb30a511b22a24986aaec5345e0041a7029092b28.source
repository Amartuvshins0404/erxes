import { RegistrationFormDefinition } from '@/registration/types/registrationForm';

export function defaultValuesFromDefinition(
  definition: RegistrationFormDefinition,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const section of definition.sections) {
    for (const field of section.fields) {
      switch (field.kind) {
        case 'text':
        case 'textarea':
        case 'date':
        case 'select':
        case 'file':
          out[field.id] = '';
          break;
        case 'boolean':
          out[field.id] = false;
          break;
        case 'multiselect':
        case 'checkbox_group':
        case 'file_list':
          out[field.id] = [];
          break;
        default:
          out[field.id] = '';
      }
    }
  }
  return out;
}

export function mergeInitialAnswers(
  definition: RegistrationFormDefinition,
  initialAnswers?: Record<string, unknown>,
): Record<string, unknown> {
  const base = defaultValuesFromDefinition(definition);
  if (!initialAnswers) return base;
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (Object.prototype.hasOwnProperty.call(initialAnswers, field.id)) {
        base[field.id] = initialAnswers[field.id];
      }
    }
  }
  return base;
}

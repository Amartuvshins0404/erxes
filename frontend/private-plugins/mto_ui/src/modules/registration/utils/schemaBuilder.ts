import {
  RegistrationField,
  RegistrationFieldKind,
  RegistrationFieldOption,
  RegistrationSection,
} from '@/registration/types/registrationForm';

const OPTION_REQUIRED_KINDS: RegistrationFieldKind[] = [
  'select',
  'multiselect',
  'checkbox_group',
];

export function createEmptyField(): RegistrationField {
  return {
    id: '',
    kind: 'text',
    label: '',
    required: false,
    acknowledgment: false,
    options: [],
  };
}

export function createEmptySection(): RegistrationSection {
  return {
    id: '',
    title: '',
    description: '',
    fields: [createEmptyField()],
  };
}

export function createEmptyOption(): RegistrationFieldOption {
  return { value: '', label: '' };
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }
  const clone = [...items];
  const [item] = clone.splice(from, 1);
  clone.splice(to, 0, item);
  return clone;
}

export function normalizeSectionsFromUnknown(
  value: unknown,
): RegistrationSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((section) => section && typeof section === 'object')
    .map((section) => {
      const rawSection = section as Record<string, unknown>;
      const rawFields = Array.isArray(rawSection.fields)
        ? rawSection.fields
        : [];

      const fields: RegistrationField[] = rawFields
        .filter((field) => field && typeof field === 'object')
        .map((field) => {
          const rawField = field as Record<string, unknown>;
          const kindValue = String(
            rawField.kind ?? 'text',
          ) as RegistrationFieldKind;
          const kind: RegistrationFieldKind = [
            'text',
            'textarea',
            'date',
            'boolean',
            'select',
            'multiselect',
            'checkbox_group',
            'file',
            'file_list',
          ].includes(kindValue)
            ? kindValue
            : 'text';

          const options = Array.isArray(rawField.options)
            ? rawField.options
                .filter((opt) => opt && typeof opt === 'object')
                .map((opt) => {
                  const rawOpt = opt as Record<string, unknown>;
                  return {
                    value: String(rawOpt.value ?? ''),
                    label: String(rawOpt.label ?? ''),
                  };
                })
            : [];

          return {
            id: String(rawField.id ?? ''),
            kind,
            label: String(rawField.label ?? ''),
            required: rawField.required === true,
            acknowledgment: rawField.acknowledgment === true,
            options,
          };
        });

      return {
        id: String(rawSection.id ?? ''),
        title:
          rawSection.title === undefined || rawSection.title === null
            ? ''
            : String(rawSection.title),
        description:
          rawSection.description === undefined ||
          rawSection.description === null
            ? ''
            : String(rawSection.description),
        fields,
      };
    });
}

export function validateSchemaSections(
  sections: RegistrationSection[],
): string | null {
  if (!Array.isArray(sections) || sections.length === 0) {
    return 'At least one section is required';
  }

  const fieldIds: string[] = [];
  for (const section of sections) {
    if (!section.id.trim()) return 'Every section must have an id';
    if (!Array.isArray(section.fields) || section.fields.length === 0) {
      return `Section "${section.id}" must contain at least one field`;
    }

    for (const field of section.fields) {
      if (!field.id.trim()) return 'Every field must have an id';
      if (!field.label?.trim()) return `Field "${field.id}" must have a label`;
      fieldIds.push(field.id.trim());

      if (OPTION_REQUIRED_KINDS.includes(field.kind)) {
        const opts = (field.options ?? []).filter(
          (opt) => opt.value.trim() && opt.label.trim(),
        );
        if (opts.length === 0) {
          return `Field "${field.id}" requires at least one option`;
        }
      }
    }
  }

  const duplicate = fieldIds.find((id, idx) => fieldIds.indexOf(id) !== idx);
  if (duplicate) return `Duplicate field id: ${duplicate}`;

  return null;
}

export function compareSchemaVersion(a: string, b: string): number {
  const ax = a.split(/[.-]/).map((p) => parseInt(p, 10) || 0);
  const bx = b.split(/[.-]/).map((p) => parseInt(p, 10) || 0);
  const len = Math.max(ax.length, bx.length);
  for (let i = 0; i < len; i++) {
    const na = ax[i] ?? 0;
    const nb = bx[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  if (a !== b) return a.localeCompare(b);
  return 0;
}

export function getLatestSchemaVersion(
  versions: string[],
): string | null {
  if (versions.length === 0) return null;
  return [...versions].sort((a, b) => compareSchemaVersion(b, a))[0];
}

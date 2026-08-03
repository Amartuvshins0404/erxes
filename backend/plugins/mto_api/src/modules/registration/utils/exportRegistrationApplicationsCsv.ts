import { IModels } from '~/connectionResolvers';
import { getRegistrationFormDefinition } from '@/registration/schemas/registry';

const EXPORT_LIMIT = 5000;

const NAME_KEYS = [
  'legal_entity_name',
  'business_name_en',
  'org_name',
  'ngo_name',
  'first_name',
  'last_name',
] as const;

function csvEscape(value: unknown): string {
  const raw = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function answerString(
  answers: Record<string, unknown> | undefined,
  key: string,
): string {
  if (!answers) return '';
  const value = answers[key];
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    return value.map(String).join('; ');
  }
  return String(value);
}

function resolveName(answers: Record<string, unknown> | undefined): string {
  if (!answers) return '';
  const parts: string[] = [];
  for (const key of NAME_KEYS) {
    const value = answers[key];
    if (typeof value === 'string' && value.trim()) {
      parts.push(value.trim());
    }
  }
  return [...new Set(parts)].join(' / ');
}

function resolveActivityCategories(
  answers: Record<string, unknown> | undefined,
): string {
  if (!answers) return '';
  const values: string[] = [];
  for (const key of [
    'activity_directions',
    'org_categories',
    'product_types',
  ] as const) {
    const value = answers[key];
    if (Array.isArray(value)) {
      values.push(...value.map(String));
    } else if (typeof value === 'string' && value.trim()) {
      values.push(value.trim());
    }
  }
  return [...new Set(values)].join('; ');
}

export async function exportRegistrationApplicationsCsv(
  models: IModels,
  filter: Record<string, unknown>,
): Promise<string> {
  const docs = await models.RegistrationApplication.find(filter)
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  const header = [
    '_id',
    'membershipTypeId',
    'membershipTypeTitle',
    'status',
    'name',
    'registrationNumber',
    'email',
    'paymentStatus',
    'createdAt',
    'activityCategories',
  ];

  const rows: string[] = [header.join(',')];

  for (const doc of docs) {
    const answers = (doc.answers ?? {}) as Record<string, unknown>;
    const membershipTypeId = String(doc.membershipTypeId ?? '');
    const schemaVersion = String(doc.schemaVersion ?? '');
    const def = await getRegistrationFormDefinition(
      models,
      membershipTypeId,
      schemaVersion,
    );

    rows.push(
      [
        csvEscape(doc._id),
        csvEscape(membershipTypeId),
        csvEscape(def?.title ?? membershipTypeId),
        csvEscape(doc.status),
        csvEscape(resolveName(answers)),
        csvEscape(answerString(answers, 'registration_number')),
        csvEscape(answerString(answers, 'contact_email')),
        csvEscape(doc.paymentStatus),
        csvEscape(
          doc.createdAt instanceof Date
            ? doc.createdAt.toISOString()
            : doc.createdAt,
        ),
        csvEscape(resolveActivityCategories(answers)),
      ].join(','),
    );
  }

  return rows.join('\n');
}

import { z } from 'zod';

import type {
  IConnection,
  IConnectionField,
  IConnectionFormValues,
  IConnectionHeaderRow,
  IConnectionPayload,
  IConnectionType,
  TConnectionFieldKind,
  TConnectionScope,
} from '../types';

export const getFieldKind = (field: IConnectionField): TConnectionFieldKind => {
  if (
    field.kind === 'url' ||
    field.kind === 'select' ||
    field.kind === 'headers'
  ) {
    return field.kind;
  }
  return 'text';
};

const isValidUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const toHeaderRows = (value: unknown): IConnectionHeaderRow[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).map(
    ([key, headerValue]) => ({ key, value: String(headerValue ?? '') }),
  );
};

export const buildDefaultValues = (
  type: IConnectionType,
  options: {
    connection?: IConnection;
    scope: TConnectionScope;
  },
): IConnectionFormValues => {
  const { connection, scope } = options;
  const config = connection?.config ?? {};
  const fields: Record<string, string> = {};
  const headers: Record<string, IConnectionHeaderRow[]> = {};

  for (const field of type.fields) {
    const kind = getFieldKind(field);

    if (field.secret) {
      fields[field.name] = '';
      continue;
    }

    if (kind === 'headers') {
      headers[field.name] = toHeaderRows(config[field.name]);
      continue;
    }

    const stored = config[field.name];
    fields[field.name] = connection
      ? typeof stored === 'string'
        ? stored
        : ''
      : field.defaultValue ?? '';
  }

  return {
    name: connection?.name ?? '',
    scope: connection ? (connection.scope as TConnectionScope) : scope,
    services: connection ? connection.services : type.defaultServices,
    fields,
    headers,
    cleared: {},
  };
};

export const buildConnectionSchema = (
  type: IConnectionType,
  options: { storedSecrets: string[] },
): z.ZodType<IConnectionFormValues> => {
  const stored = new Set(options.storedSecrets);

  return z
    .object({
      name: z.string().trim().min(1, 'Name is required'),
      scope: z.enum(['workspace', 'personal']),
      services: z.array(z.string()),
      fields: z.record(z.string()),
      headers: z.record(
        z.array(z.object({ key: z.string(), value: z.string() })),
      ),
      cleared: z.record(z.boolean()),
    })
    .superRefine((values, context) => {
      for (const field of type.fields) {
        const kind = getFieldKind(field);

        if (kind === 'headers' && !field.secret) {
          const rows = values.headers[field.name] ?? [];
          rows.forEach((row, index) => {
            if (row.value.trim() && !row.key.trim()) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['headers', field.name, index, 'key'],
                message: 'Header name is required',
              });
            }
          });
          continue;
        }

        const value = (values.fields[field.name] ?? '').trim();

        if (field.secret) {
          const cleared = values.cleared[field.name] === true;
          const keeps = stored.has(field.name) && !cleared && !value;
          if (field.required && !value && !keeps) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['fields', field.name],
              message: `${field.label} is required`,
            });
          }
          continue;
        }

        if (!value) {
          if (field.required) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['fields', field.name],
              message: `${field.label} is required`,
            });
          }
          continue;
        }

        if (kind === 'url' && !isValidUrl(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['fields', field.name],
            message: 'Enter a valid http(s) URL',
          });
        }

        if (
          kind === 'select' &&
          field.options &&
          !field.options.includes(value)
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['fields', field.name],
            message: 'Choose one of the options',
          });
        }
      }
    });
};

export const buildConnectionPayload = (
  type: IConnectionType,
  values: IConnectionFormValues,
  options: { editing: boolean },
): IConnectionPayload => {
  const config: Record<string, unknown> = {};
  const secrets: Record<string, string> = {};
  const clearBlank = (name: string) => {
    if (options.editing) {
      config[name] = null;
    }
  };

  for (const field of type.fields) {
    const kind = getFieldKind(field);

    if (field.secret) {
      const entered = (values.fields[field.name] ?? '').trim();
      if (entered) {
        secrets[field.name] = entered;
      } else if (values.cleared[field.name] === true) {
        secrets[field.name] = '';
      }
      continue;
    }

    if (kind === 'headers') {
      const entries = (values.headers[field.name] ?? [])
        .map((row) => [row.key.trim(), row.value.trim()] as const)
        .filter(([key]) => key.length > 0);
      if (entries.length > 0) {
        config[field.name] = Object.fromEntries(entries);
      } else {
        clearBlank(field.name);
      }
      continue;
    }

    const value = (values.fields[field.name] ?? '').trim();
    if (value) {
      config[field.name] = value;
    } else {
      clearBlank(field.name);
    }
  }

  return { config, secrets };
};

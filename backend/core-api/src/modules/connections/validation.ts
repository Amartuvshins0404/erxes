import { ExpectedError } from 'erxes-api-shared/utils';
import type {
  IConnectionField,
  IConnectionTypeDefinition,
} from './types/definition';

const MAX_TEXT_LENGTH = 500;
const MAX_SECRET_LENGTH = 4000;
const MAX_HEADERS = 50;
const HEADER_NAME_PATTERN = /^[A-Za-z0-9-]{1,100}$/;
const SERVICE_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const invalid = (message: string) =>
  new ExpectedError(message, 'VALIDATION_ERROR');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBlank = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '');

const toObject = (value: unknown, label: string): Record<string, unknown> => {
  if (value === undefined || value === null) {
    return {};
  }

  if (!isRecord(value)) {
    throw invalid(`${label} must be an object.`);
  }

  return value;
};

const normalizeHeaders = (
  field: IConnectionField,
  value: unknown,
): Record<string, string> => {
  if (!isRecord(value)) {
    throw invalid(
      `${field.label} must be an object of header names and values.`,
    );
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_HEADERS) {
    throw invalid(`${field.label} accepts at most ${MAX_HEADERS} headers.`);
  }

  const headers: Record<string, string> = {};

  for (const [name, headerValue] of entries) {
    if (!HEADER_NAME_PATTERN.test(name) || typeof headerValue !== 'string') {
      throw invalid(`${field.label} has an invalid header "${name}".`);
    }

    if (headerValue.length > MAX_SECRET_LENGTH) {
      throw invalid(`${field.label} header "${name}" is too long.`);
    }

    headers[name] = headerValue;
  }

  return headers;
};

const normalizeConfigValue = (
  field: IConnectionField,
  value: unknown,
): unknown => {
  if (field.kind === 'headers') {
    return normalizeHeaders(field, value);
  }

  if (typeof value !== 'string') {
    throw invalid(`${field.label} must be text.`);
  }

  const text = value.trim();

  if (text.length > MAX_TEXT_LENGTH) {
    throw invalid(`${field.label} is too long.`);
  }

  if (field.kind === 'select' && !field.options?.includes(text)) {
    throw invalid(
      `${field.label} must be one of: ${field.options?.join(', ')}.`,
    );
  }

  if (field.kind === 'url') {
    let protocol = '';

    try {
      protocol = new URL(text).protocol;
    } catch {
      protocol = '';
    }

    if (protocol !== 'http:' && protocol !== 'https:') {
      throw invalid(`${field.label} must be an http(s) URL.`);
    }
  }

  return text;
};

export const normalizeConfig = (
  definition: IConnectionTypeDefinition,
  raw: unknown,
): Record<string, unknown> => {
  const input = toObject(raw, 'Config');
  const fields = definition.fields.filter((field) => !field.secret);
  const known = new Set(fields.map((field) => field.name));

  for (const key of Object.keys(input)) {
    if (!known.has(key)) {
      throw invalid(`Unknown config field "${key}" for ${definition.label}.`);
    }
  }

  const config: Record<string, unknown> = {};

  for (const field of fields) {
    const value = isBlank(input[field.name])
      ? field.defaultValue
      : input[field.name];

    if (isBlank(value)) {
      if (field.required) {
        throw invalid(`${field.label} is required.`);
      }

      continue;
    }

    config[field.name] = normalizeConfigValue(field, value);
  }

  return config;
};

export const mergeConfigInput = (
  current: Record<string, unknown>,
  raw: unknown,
): Record<string, unknown> => {
  const merged = { ...current };

  for (const [key, value] of Object.entries(toObject(raw, 'Config'))) {
    if (isBlank(value)) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  return merged;
};

export const normalizeSecretInput = (
  definition: IConnectionTypeDefinition,
  raw: unknown,
): Record<string, string> => {
  const input = toObject(raw, 'Secrets');
  const known = new Set(
    definition.fields
      .filter((field) => field.secret)
      .map((field) => field.name),
  );
  const secrets: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!known.has(key)) {
      throw invalid(`Unknown secret field "${key}" for ${definition.label}.`);
    }

    if (typeof value !== 'string') {
      throw invalid(`${key} must be text.`);
    }

    const text = value.trim();

    if (text.length > MAX_SECRET_LENGTH) {
      throw invalid(`${key} is too long.`);
    }

    secrets[key] = text;
  }

  return secrets;
};

export const assertRequiredSecrets = (
  definition: IConnectionTypeDefinition,
  presentFields: Iterable<string>,
): void => {
  const present = new Set(presentFields);

  for (const field of definition.fields) {
    if (field.secret && field.required && !present.has(field.name)) {
      throw invalid(`${field.label} is required.`);
    }
  }
};

export const normalizeName = (value: unknown): string => {
  const name = typeof value === 'string' ? value.trim() : '';

  if (!name) {
    throw invalid('Name is required.');
  }

  if (name.length > 100) {
    throw invalid('Name is too long.');
  }

  return name;
};

export const normalizeServices = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throw invalid('Services must be a list.');
  }

  const services = new Set<string>();

  for (const service of value) {
    const name = typeof service === 'string' ? service.trim() : '';

    if (!SERVICE_NAME_PATTERN.test(name)) {
      throw invalid(`Invalid service name "${String(service)}".`);
    }

    services.add(name);
  }

  return [...services];
};

import type { IConnection, IConnectionType } from '../types';
import {
  buildConnectionPayload,
  buildConnectionSchema,
  buildDefaultValues,
} from '../utils/connectionForm';

const type: IConnectionType = {
  type: 'openai',
  label: 'OpenAI',
  category: 'ai',
  defaultServices: ['automations'],
  fields: [
    {
      name: 'apiKey',
      label: 'API key',
      kind: 'text',
      secret: true,
      required: true,
    },
    {
      name: 'baseUrl',
      label: 'Base URL',
      kind: 'url',
      secret: false,
      required: false,
      defaultValue: 'https://api.openai.com/v1',
    },
    {
      name: 'headers',
      label: 'Headers',
      kind: 'headers',
      secret: false,
      required: false,
    },
  ],
};

const stored: IConnection = {
  _id: 'c1',
  type: 'openai',
  name: 'Team key',
  scope: 'workspace',
  config: {
    baseUrl: 'https://proxy.example.com/v1',
    headers: { 'x-team': 'a' },
  },
  secretsSet: ['apiKey'],
  secretsUnreadable: [],
  services: ['automations'],
};

const editValues = () =>
  buildDefaultValues(type, { connection: stored, scope: 'workspace' });

describe('connection form', () => {
  it('keeps a stored secret when the field is left blank', () => {
    const values = editValues();
    const schema = buildConnectionSchema(type, { storedSecrets: ['apiKey'] });

    expect(schema.safeParse(values).success).toBe(true);
    const { secrets, config } = buildConnectionPayload(type, values, {
      editing: true,
    });
    expect(secrets).toEqual({});
    expect(config).toEqual({
      baseUrl: 'https://proxy.example.com/v1',
      headers: { 'x-team': 'a' },
    });
  });

  it('sends only the secret the user typed', () => {
    const values = editValues();
    values.fields.apiKey = '  sk-new  ';

    expect(
      buildConnectionPayload(type, values, { editing: true }).secrets,
    ).toEqual({
      apiKey: 'sk-new',
    });
  });

  it('sends an empty string only when the user clears the secret', () => {
    const values = editValues();
    values.cleared.apiKey = true;

    expect(
      buildConnectionPayload(type, values, { editing: true }).secrets,
    ).toEqual({
      apiKey: '',
    });
    expect(
      buildConnectionSchema(type, { storedSecrets: ['apiKey'] }).safeParse(
        values,
      ).success,
    ).toBe(false);
  });

  it('requires a required secret on create and when the stored one cannot be opened', () => {
    const create = buildDefaultValues(type, { scope: 'personal' });
    create.name = 'Mine';
    expect(
      buildConnectionSchema(type, { storedSecrets: [] }).safeParse(create)
        .success,
    ).toBe(false);

    create.fields.apiKey = 'sk-1';
    expect(
      buildConnectionSchema(type, { storedSecrets: [] }).safeParse(create)
        .success,
    ).toBe(true);

    expect(
      buildConnectionSchema(type, { storedSecrets: [] }).safeParse(editValues())
        .success,
    ).toBe(false);
  });

  it('prefills type defaults on create and the type default services', () => {
    const create = buildDefaultValues(type, { scope: 'workspace' });

    expect(create.fields.baseUrl).toBe('https://api.openai.com/v1');
    expect(create.services).toEqual(['automations']);
  });

  it('rejects a header value without a name and a non-http url', () => {
    const values = editValues();
    values.headers.headers = [{ key: '', value: 'x' }];
    values.fields.baseUrl = 'ftp://nope';

    const result = buildConnectionSchema(type, {
      storedSecrets: ['apiKey'],
    }).safeParse(values);

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((issue) => issue.path[0]),
    ).toEqual(expect.arrayContaining(['headers', 'fields']));
  });

  it('clears an emptied config field on edit but omits blanks on create', () => {
    const values = editValues();
    values.fields.baseUrl = '';
    values.headers.headers = [];

    expect(
      buildConnectionPayload(type, values, { editing: true }).config,
    ).toEqual({ baseUrl: null, headers: null });
    expect(
      buildConnectionPayload(type, values, { editing: false }).config,
    ).toEqual({});
  });

  it('turns header rows into a config object and drops blank rows', () => {
    const values = editValues();
    values.headers.headers = [
      { key: ' x-a ', value: ' 1 ' },
      { key: '', value: '' },
    ];

    expect(
      buildConnectionPayload(type, values, { editing: true }).config.headers,
    ).toEqual({
      'x-a': '1',
    });
  });
});

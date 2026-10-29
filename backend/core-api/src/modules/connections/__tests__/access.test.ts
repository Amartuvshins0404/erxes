jest.mock('erxes-api-shared/utils', () => ({
  ...jest.requireActual('erxes-api-shared/utils/service-auth'),
  ...jest.requireActual('erxes-api-shared/utils/mongo/mongoose-types'),
  ExpectedError: class ExpectedError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  },
}));

import { TRPCError } from '@trpc/server';
import {
  deriveServiceToken,
  signServiceRequest,
} from 'erxes-api-shared/utils/service-auth';
import type { IModels } from '~/connectionResolvers';
import {
  assertCanManage,
  canServiceResolve,
  canUserUse,
  getSecretStatus,
} from '@/connections/access';
import { sealSecret } from '@/connections/crypto';
import { loadConnectionClass } from '@/connections/db/models/Connections';
import { connectionsTrpcRouter } from '@/connections/trpc/connections';

const MASTER_KEY = 'access-test-master-key';

process.env.ERXES_MASTER_KEY = MASTER_KEY;

type TStored = Record<string, unknown> & { _id: string };

const sealed = (connectionId: string, apiKey: string) => ({
  apiKey: sealSecret({ connectionId, field: 'apiKey', plain: apiKey }),
});

const makeDoc = (overrides: Partial<TStored> = {}): TStored => ({
  _id: 'c1',
  type: 'openai',
  name: 'Team OpenAI',
  scope: 'workspace',
  config: {},
  secrets: sealed('c1', 'sk-live-secret'),
  services: ['automations'],
  ...overrides,
});

const buildModels = (docs: TStored[]) => {
  const logged: unknown[] = [];
  const stored = new Map(docs.map((doc) => [doc._id, doc]));
  const models = {} as Record<string, unknown>;
  const schema = loadConnectionClass(
    models as unknown as IModels,
    {
      sendDbEventLog: (input: unknown) => logged.push(input),
    } as never,
  );
  const withObject = (doc: TStored) => ({
    ...doc,
    toObject: () => ({ ...doc }),
  });

  models.Connections = {
    ...schema.statics,
    findOne: async ({ _id }: { _id: string }) =>
      stored.has(_id) ? withObject(stored.get(_id) as TStored) : null,
    create: async (doc: TStored) => {
      stored.set(doc._id, doc);
      return withObject(doc);
    },
    findOneAndUpdate: async (
      { _id }: { _id: string },
      { $set }: { $set: Record<string, unknown> },
    ) => {
      const next = { ...(stored.get(_id) as TStored), ...$set };
      stored.set(_id, next);
      return withObject(next);
    },
    deleteOne: async ({ _id }: { _id: string }) => stored.delete(_id),
  };

  return {
    models: models as unknown as IModels,
    connections: models.Connections as {
      resolveForService(_id: string, service: string): Promise<unknown>;
      addConnection(input: unknown, userId: string): Promise<TStored>;
      editConnection(
        _id: string,
        input: unknown,
        userId: string,
      ): Promise<TStored>;
    },
    stored,
    logged,
  };
};

describe('connection access rules', () => {
  it('lets a service resolve only workspace connections granted to it', () => {
    const workspace = {
      scope: 'workspace' as const,
      services: ['automations'],
    };

    expect(canServiceResolve(workspace, 'automations')).toBe(true);
    expect(canServiceResolve(workspace, 'sales')).toBe(false);
    expect(
      canServiceResolve(
        { scope: 'personal', ownerId: 'u1', services: ['automations'] },
        'automations',
      ),
    ).toBe(false);
  });

  it('lets a user use workspace connections and only their own personal ones', () => {
    const personal = {
      scope: 'personal' as const,
      ownerId: 'u1',
      services: [],
    };

    expect(canUserUse(personal, 'u1')).toBe(true);
    expect(canUserUse(personal, 'u2')).toBe(false);
    expect(canUserUse({ scope: 'workspace', services: [] }, 'u2')).toBe(true);
  });

  it('requires connectionsManage for workspace changes and ownership for personal ones', async () => {
    const checkPermission = jest.fn(async () => undefined);
    const ctx = { user: { _id: 'u1' }, checkPermission } as never;

    await assertCanManage(ctx, { scope: 'workspace', services: [] });
    expect(checkPermission).toHaveBeenCalledWith('connectionsManage');

    checkPermission.mockClear();
    await assertCanManage(ctx, {
      scope: 'personal',
      ownerId: 'u1',
      services: [],
    });
    expect(checkPermission).not.toHaveBeenCalled();

    await expect(
      assertCanManage(ctx, { scope: 'personal', ownerId: 'u2', services: [] }),
    ).rejects.toThrow('Connection not found');
  });

  it('reports secrets that no longer open with the current keys', () => {
    const doc = makeDoc({
      secrets: {
        ...sealed('c1', 'sk-a'),
        gatewayToken: 'enc:v2:deadbeef:AAAA:AAAA:AAAA',
      },
    });

    expect(getSecretStatus(doc as never)).toEqual({
      set: ['apiKey'],
      unreadable: ['gatewayToken'],
    });
  });
});

describe('Connections.resolveForService', () => {
  it('returns decrypted credentials to a granted service', async () => {
    const { connections } = buildModels([makeDoc()]);

    await expect(
      connections.resolveForService('c1', 'automations'),
    ).resolves.toEqual({
      _id: 'c1',
      type: 'openai',
      name: 'Team OpenAI',
      config: {},
      secrets: { apiKey: 'sk-live-secret' },
    });
  });

  it.each([
    ['a service that was not granted', makeDoc(), 'sales'],
    [
      'a personal connection',
      makeDoc({ scope: 'personal', ownerId: 'u1' }),
      'automations',
    ],
    ['an unknown connection', makeDoc({ _id: 'other' }), 'automations'],
  ])('denies %s', async (_case, doc, service) => {
    const { connections } = buildModels([doc]);

    await expect(connections.resolveForService('c1', service)).rejects.toThrow(
      'Connection not found',
    );
  });

  it('refuses to hand out a connection whose secrets cannot be decrypted', async () => {
    const { connections } = buildModels([
      makeDoc({ secrets: { apiKey: 'enc:v2:deadbeef:AAAA:AAAA:AAAA' } }),
    ]);

    await expect(
      connections.resolveForService('c1', 'automations'),
    ).rejects.toThrow('cannot be decrypted');
  });
});

describe('connections tRPC service authentication', () => {
  const SUBDOMAIN = 'acme';
  const callAs = async ({
    service = 'automations',
    header,
    docs = [makeDoc()],
    subdomain = SUBDOMAIN,
  }: {
    service?: string;
    header?: string | null;
    docs?: TStored[];
    subdomain?: string;
  } = {}) => {
    const { models } = buildModels(docs);
    const signed =
      header === undefined
        ? signServiceRequest({
            serviceName: service,
            token: deriveServiceToken(MASTER_KEY, service),
            subdomain: SUBDOMAIN,
            path: 'connections.resolve',
            body: JSON.stringify({ _id: 'c1' }),
          })
        : header;

    return connectionsTrpcRouter
      .createCaller({
        models,
        subdomain,
        serviceAuthHeader: signed ?? undefined,
      } as never)
      .connections.resolve({ _id: 'c1' });
  };

  it('resolves for a correctly signed, granted service', async () => {
    await expect(callAs()).resolves.toMatchObject({
      _id: 'c1',
      secrets: { apiKey: 'sk-live-secret' },
    });
  });

  it('rejects requests without or with a forged service signature', async () => {
    await expect(callAs({ header: null })).rejects.toBeInstanceOf(TRPCError);
    await expect(callAs({ header: 'v1.automations.1.forged' })).rejects.toThrow(
      'Invalid service authentication',
    );
  });

  it('rejects a signature replayed for another tenant', async () => {
    await expect(callAs({ subdomain: 'other-tenant' })).rejects.toThrow(
      'Invalid service authentication',
    );
  });

  it('applies the connection grants of the authenticated service, not the claimed one', async () => {
    await expect(callAs({ service: 'sales' })).rejects.toThrow(
      'Connection not found',
    );
  });
});

describe('connection writes', () => {
  const secretValue = 'sk-live-super-secret';

  it('seals secrets at rest and keeps them out of event logs', async () => {
    const { connections, stored, logged } = buildModels([]);

    const created = await connections.addConnection(
      { type: 'openai', name: 'Team', secrets: { apiKey: secretValue } },
      'u1',
    );
    const stage = stored.get(created._id) as TStored;
    const sealedValue = (stage.secrets as Record<string, string>).apiKey;

    expect(sealedValue).toMatch(/^enc:v2:/);
    expect(sealedValue).not.toContain(secretValue);
    expect(created.services).toEqual(['automations']);

    await connections.editConnection(
      created._id,
      { secrets: { apiKey: `${secretValue}-rotated` } },
      'u1',
    );

    expect(logged).toHaveLength(2);

    const logText = JSON.stringify(logged);

    expect(logText).not.toContain(secretValue);
    expect(logText).not.toContain('enc:v2:');
    expect(logText).toContain('secretFields');
  });

  it('keeps, replaces and clears secrets according to the edit input', async () => {
    const { connections, stored } = buildModels([makeDoc()]);
    const before = (stored.get('c1')?.secrets as Record<string, string>).apiKey;

    await connections.editConnection('c1', { name: 'Renamed' }, 'u1');
    expect((stored.get('c1')?.secrets as Record<string, string>).apiKey).toBe(
      before,
    );

    await connections.editConnection(
      'c1',
      { secrets: { apiKey: 'sk-new' } },
      'u1',
    );
    expect(
      (stored.get('c1')?.secrets as Record<string, string>).apiKey,
    ).not.toBe(before);

    await expect(
      connections.editConnection('c1', { secrets: { apiKey: '' } }, 'u1'),
    ).rejects.toThrow('API key is required');
  });

  it('rejects unknown types, missing required secrets and secrets sent as config', async () => {
    const { connections } = buildModels([]);

    await expect(
      connections.addConnection({ type: 'nope', name: 'x' }, 'u1'),
    ).rejects.toThrow('Unsupported connection type');
    await expect(
      connections.addConnection({ type: 'openai', name: 'x' }, 'u1'),
    ).rejects.toThrow('API key is required');
    await expect(
      connections.addConnection(
        {
          type: 'openai',
          name: 'x',
          config: { apiKey: 'sk-in-config' },
          secrets: { apiKey: 'k' },
        },
        'u1',
      ),
    ).rejects.toThrow('Unknown config field');
  });

  it('stores personal connections without service grants', async () => {
    const { connections } = buildModels([]);
    const created = await connections.addConnection(
      {
        type: 'openai',
        name: 'Mine',
        scope: 'personal',
        secrets: { apiKey: 'sk' },
        services: ['automations'],
      },
      'u1',
    );

    expect(created).toMatchObject({
      scope: 'personal',
      ownerId: 'u1',
      services: [],
    });
  });
});

/// <reference types="jest" />

import { randomUUID } from 'node:crypto';
import type { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '~/connectionResolvers';

const DATABASE = `erxes_accounting_scope_test_${randomUUID().replace(
  /-/g,
  '',
)}`;

process.env.MONGO_URL = `mongodb://127.0.0.1:27017/${DATABASE}?directConnection=true`;

jest.setTimeout(30_000);

const STRUCTURE_ORDERS: Record<string, string> = {
  B: 'root/B/',
  W: 'root/B/W/',
  D: 'root/D/',
  T: 'root/D/T/',
  X: 'root/X/',
  Y: 'root/Y/',
};

let coreConfigs: Record<string, unknown> = {};
const memberships: Record<string, string[]> = {};

type TCoreMessage = {
  module: string;
  action: string;
  input?: { userId?: string; query?: { _id?: { $in?: string[] } } };
  defaultValue?: unknown;
};

const coreResponse = ({
  module,
  action,
  input,
  defaultValue,
}: TCoreMessage) => {
  if (module === 'configs' && action === 'getConfigs') {
    return coreConfigs;
  }

  if (module === 'structureEntities' && action === 'userContext') {
    const entityIds = memberships[input?.userId || ''] || [];

    return {
      primaryEntityId: entityIds[0],
      entityIds,
      principalEntityIds: entityIds,
      boundaryEntityIds: [],
      boundaryUserIds: [],
    };
  }

  if (module === 'structureEntities' && action === 'findWithDescendants') {
    const ids = input?.query?._id?.$in || [];

    return Object.entries(STRUCTURE_ORDERS)
      .filter(([, order]) => ids.some((id) => order.includes(`/${id}/`)))
      .map(([_id]) => ({ _id }));
  }

  return defaultValue;
};

jest.mock('erxes-api-shared/utils/trpc', () => ({
  ...jest.requireActual('erxes-api-shared/utils/trpc'),
  sendTRPCMessage: jest.fn(async (message: TCoreMessage) =>
    coreResponse(message),
  ),
}));

type ITransactionsCommon = typeof import('../transactionsCommon');

let models: IModels;
let generateFilter: ITransactionsCommon['generateFilter'];

const TRANSACTIONS = {
  placeBResponsibleD: { placeEntityId: 'W', responsibleEntityId: 'T' },
  placeXResponsibleD: { placeEntityId: 'X', responsibleEntityId: 'T' },
  placeBResponsibleY: { placeEntityId: 'W', responsibleEntityId: 'Y' },
  placeXResponsibleY: { placeEntityId: 'X', responsibleEntityId: 'Y' },
};

const makeUser = (entityIds: string[], extra = {}) => {
  const _id = randomUUID();
  memberships[_id] = entityIds;

  return { _id, ...extra } as IUserDocument;
};

const visibleTransactions = async (
  user: IUserDocument,
  params: Record<string, unknown> = {},
) => {
  const filter = await generateFilter('test', models, params as never, user, {
    skipAccountPermission: true,
  });
  const docs = await models.Transactions.find(filter, { _id: 1 }).lean();

  return docs.map((doc) => doc._id).sort();
};

beforeAll(async () => {
  const { default: mongoose } = await import('mongoose');
  const resolvers = await import('~/connectionResolvers');

  ({ generateFilter } = await import('../transactionsCommon'));
  models = await resolvers.generateModels('test');
  await mongoose.connection.asPromise();

  await models.Transactions.collection.insertMany(
    Object.entries(TRANSACTIONS).map(([_id, structure]) => ({
      _id: _id as never,
      journal: 'main',
      status: 'complete',
      ...structure,
    })),
  );
}, 60_000);

beforeEach(() => {
  coreConfigs = {};
});

afterAll(async () => {
  const { default: mongoose } = await import('mongoose');

  mongoose.connection.removeAllListeners('disconnected');
  await mongoose.disconnect();
  const cleanup = await mongoose
    .createConnection('mongodb://127.0.0.1:27017/admin?directConnection=true')
    .asPromise();
  await cleanup.useDb(DATABASE).dropDatabase();
  await cleanup.close();
});

describe('transaction structure filters', () => {
  it('includes everything below the selected place node', async () => {
    expect(
      await visibleTransactions(makeUser([]), { placeEntityId: 'B' }),
    ).toEqual(['placeBResponsibleD', 'placeBResponsibleY']);
  });

  it('includes everything below the selected responsible node', async () => {
    expect(
      await visibleTransactions(makeUser([]), { responsibleEntityId: 'D' }),
    ).toEqual(['placeBResponsibleD', 'placeXResponsibleD']);
  });

  it('shows every transaction when team member checking is off', async () => {
    expect(await visibleTransactions(makeUser(['B', 'D']))).toEqual(
      Object.keys(TRANSACTIONS).sort(),
    );
  });

  it('limits a checked member to transactions within their structure nodes', async () => {
    coreConfigs = { CHECK_TEAM_MEMBER_SHOWN: true };

    expect(await visibleTransactions(makeUser(['B', 'D']))).toEqual([
      'placeBResponsibleD',
    ]);
  });

  it('keeps a checked member within their nodes when they filter by a node', async () => {
    coreConfigs = { CHECK_TEAM_MEMBER_SHOWN: true };
    const user = makeUser(['B', 'D']);

    expect(await visibleTransactions(user, { placeEntityId: 'X' })).toEqual([]);
    expect(await visibleTransactions(user, { placeEntityId: 'W' })).toEqual([
      'placeBResponsibleD',
    ]);
    expect(
      await visibleTransactions(user, { responsibleEntityId: 'Y' }),
    ).toEqual([]);
  });

  it('lifts only the place limit for branch master members', async () => {
    const user = makeUser(['B', 'D']);
    coreConfigs = {
      CHECK_TEAM_MEMBER_SHOWN: true,
      BRANCHES_MASTER_TEAM_MEMBERS_IDS: [user._id],
    };

    expect(await visibleTransactions(user)).toEqual([
      'placeBResponsibleD',
      'placeXResponsibleD',
    ]);
  });

  it('lifts only the responsible limit for department master members', async () => {
    const user = makeUser(['B', 'D']);
    coreConfigs = {
      CHECK_TEAM_MEMBER_SHOWN: true,
      DEPARTMENTS_MASTER_TEAM_MEMBERS_IDS: [user._id],
    };

    expect(await visibleTransactions(user)).toEqual([
      'placeBResponsibleD',
      'placeBResponsibleY',
    ]);
  });

  it('does not limit owners or members without structure nodes', async () => {
    coreConfigs = { CHECK_TEAM_MEMBER_SHOWN: true };

    expect(
      await visibleTransactions(makeUser(['B', 'D'], { isOwner: true })),
    ).toEqual(Object.keys(TRANSACTIONS).sort());
    expect(await visibleTransactions(makeUser([]))).toEqual(
      Object.keys(TRANSACTIONS).sort(),
    );
  });
});

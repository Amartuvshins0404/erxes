/// <reference types="jest" />

import { randomUUID } from 'node:crypto';
import type { IModels } from '~/connectionResolvers';
import { JOURNALS, TR_SIDES } from '../../@types/constants';

const DATABASE = `erxes_accounting_place_test_${randomUUID().replace(
  /-/g,
  '',
)}`;

process.env.MONGO_URL = `mongodb://127.0.0.1:27017/${DATABASE}?directConnection=true`;

jest.setTimeout(30_000);

type IInventoryUtils = typeof import('../inventories');

let models: IModels;
let inventories: IInventoryUtils;

const ACCOUNT = 'inventory-account';
const PRODUCT = 'product-a';

const insertTransaction = (doc: Record<string, unknown>) =>
  models.Transactions.collection.insertOne({
    _id: randomUUID() as never,
    date: new Date('2026-01-10'),
    status: 'complete',
    ...doc,
  });

const inventoryDetail = (count: number, amount: number, extra = {}) => ({
  _id: randomUUID(),
  accountId: ACCOUNT,
  productId: PRODUCT,
  count,
  amount,
  ...extra,
});

beforeAll(async () => {
  const { default: mongoose } = await import('mongoose');
  const resolvers = await import('~/connectionResolvers');

  inventories = await import('../inventories');
  models = await resolvers.generateModels('test');
  await mongoose.connection.asPromise();
}, 60_000);

afterEach(async () => {
  await models.Transactions.collection.deleteMany({});
  await models.AdjustInventories.collection.deleteMany({});
  await models.AdjustInvDetails.collection.deleteMany({});
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

describe('inventory keyed by one place node', () => {
  it('pools stock received at one place under different responsible nodes', async () => {
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-a',
      responsibleEntityId: 'responsible-1',
      details: [inventoryDetail(2, 200)],
    });
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-a',
      responsibleEntityId: 'responsible-2',
      details: [inventoryDetail(3, 360)],
    });
    await insertTransaction({
      journal: JOURNALS.INV_OUT,
      side: TR_SIDES.CREDIT,
      placeEntityId: 'place-a',
      responsibleEntityId: 'responsible-3',
      details: [inventoryDetail(1, 112)],
    });

    const costs = await inventories.activeCost(models, ACCOUNT, 'place-a', [
      PRODUCT,
    ]);

    expect(costs[PRODUCT]).toEqual({
      remainder: 4,
      totalCost: 448,
      unitCost: 112,
    });
  });

  it('keeps stock of other places out and honours a detail-level place', async () => {
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-a',
      responsibleEntityId: 'responsible-1',
      details: [inventoryDetail(2, 200)],
    });
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-b',
      responsibleEntityId: 'responsible-1',
      details: [inventoryDetail(5, 500)],
    });
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-b',
      details: [inventoryDetail(1, 150, { placeEntityId: 'place-a' })],
    });

    const placeA = await inventories.activeCost(models, ACCOUNT, 'place-a', [
      PRODUCT,
    ]);
    const placeB = await inventories.activeCost(models, ACCOUNT, 'place-b', [
      PRODUCT,
    ]);

    expect(placeA[PRODUCT]).toMatchObject({ remainder: 3, totalCost: 350 });
    expect(placeB[PRODUCT]).toMatchObject({ remainder: 5, totalCost: 500 });
  });

  it('starts from the published adjustment balance of the place', async () => {
    const adjustId = randomUUID();

    await models.AdjustInventories.collection.insertOne({
      _id: adjustId as never,
      date: new Date('2026-01-01'),
      status: 'publish',
      createdAt: new Date('2026-01-01'),
    });
    await models.AdjustInvDetails.collection.insertOne({
      _id: randomUUID() as never,
      adjustId,
      accountId: ACCOUNT,
      productId: PRODUCT,
      placeEntityId: 'place-a',
      remainder: 10,
      cost: 1000,
      unitCost: 100,
    });
    await insertTransaction({
      journal: JOURNALS.INV_INCOME,
      side: TR_SIDES.DEBIT,
      placeEntityId: 'place-a',
      responsibleEntityId: 'responsible-9',
      details: [inventoryDetail(2, 300)],
    });

    const costs = await inventories.activeCost(models, ACCOUNT, 'place-a', [
      PRODUCT,
    ]);

    expect(costs[PRODUCT]).toMatchObject({ remainder: 12, totalCost: 1300 });
  });
});

jest.mock('../product', () => ({
  getAllowedProducts: jest.fn(
    (_subdomain: string, _plan: unknown, productIds: string[]) => productIds,
  ),
}));

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: jest.fn(),
}));

import sift from 'sift';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { IPricingPlanDocument } from '@/pricing/@types/pricingPlan';
import { checkPricing } from '../index';

const mockedTRPC = sendTRPCMessage as jest.Mock;

const NODES: Record<string, { _id: string; order: string }> = {
  root: { _id: 'root', order: 'root/' },
  north: { _id: 'north', order: 'root/north/' },
  store1: { _id: 'store1', order: 'root/north/store1/' },
  south: { _id: 'south', order: 'root/south/' },
  store2: { _id: 'store2', order: 'root/south/store2/' },
};

const plan = (
  _id: string,
  value: number,
  overrides: Partial<IPricingPlanDocument> = {},
): IPricingPlanDocument =>
  ({
    _id,
    status: 'active',
    type: 'subtraction',
    value,
    priceAdjustType: 'none',
    priceAdjustFactor: 0,
    applyType: 'product',
    products: ['p1'],
    priority: '',
    isStartDateEnabled: false,
    isEndDateEnabled: false,
    placeEntityIds: [],
    ...overrides,
  } as unknown as IPricingPlanDocument);

const makeModels = (plans: IPricingPlanDocument[]): IModels =>
  ({
    PricingPlans: {
      find: jest.fn((filter: Record<string, unknown>) => ({
        sort: jest.fn().mockResolvedValue(plans.filter(sift(filter))),
      })),
    },
  } as unknown as IModels);

const priceAt = (plans: IPricingPlanDocument[], placeEntityId?: string) =>
  checkPricing({
    models: makeModels(plans),
    subdomain: 'test',
    prioritizeRule: 'exclude',
    totalAmount: 100,
    placeEntityId,
    orderItems: [{ itemId: 'i1', productId: 'p1', quantity: 1, price: 100 }],
  });

beforeEach(() =>
  mockedTRPC
    .mockReset()
    .mockImplementation(async ({ module, action, input }) =>
      module === 'structureEntities' && action === 'findOne'
        ? NODES[input?.query?._id] || null
        : false,
    ),
);

describe('checkPricing — place-node conditions', () => {
  it('applies a plan placed at a node to a sale below it', async () => {
    const result = await priceAt(
      [plan('north', 10, { placeEntityIds: ['north'] })],
      'store1',
    );

    expect(result?.i1?.value).toBe(10);
  });

  it('applies a plan placed at the exact sale node', async () => {
    const result = await priceAt(
      [plan('store1', 10, { placeEntityIds: ['store1'] })],
      'store1',
    );

    expect(result?.i1?.value).toBe(10);
  });

  it('skips a plan placed at another branch of the tree', async () => {
    const result = await priceAt(
      [plan('south', 10, { placeEntityIds: ['south'] })],
      'store1',
    );

    expect(result).toBeUndefined();
  });

  it('skips a placed plan when the sale has no place', async () => {
    const result = await priceAt([
      plan('north', 10, { placeEntityIds: ['north'] }),
    ]);

    expect(result).toBeUndefined();
  });

  it('applies a plan without a place everywhere', async () => {
    const result = await priceAt([plan('anywhere', 10)], 'store2');

    expect(result?.i1?.value).toBe(10);
  });

  it('lets the closest node win over a larger discount further up', async () => {
    const result = await priceAt(
      [
        plan('anywhere', 40),
        plan('north', 30, { placeEntityIds: ['north'] }),
        plan('store1', 10, { placeEntityIds: ['store1'] }),
      ],
      'store1',
    );

    expect(result?.i1?.value).toBe(10);
  });

  it('lets the closest node win whatever order the plans arrive in', async () => {
    const result = await priceAt(
      [
        plan('store1', 10, { placeEntityIds: ['store1'] }),
        plan('north', 30, { placeEntityIds: ['north'] }),
      ],
      'store1',
    );

    expect(result?.i1?.value).toBe(10);
  });

  it('treats a plan on the root like a plan without a place', async () => {
    const result = await priceAt(
      [plan('anywhere', 20), plan('root', 15, { placeEntityIds: ['root'] })],
      'store1',
    );

    expect(result?.i1?.value).toBe(20);
  });

  it('keeps the larger discount between plans at the same node', async () => {
    const result = await priceAt(
      [
        plan('north-a', 10, { placeEntityIds: ['north'] }),
        plan('north-b', 25, { placeEntityIds: ['north', 'south'] }),
      ],
      'store1',
    );

    expect(result?.i1?.value).toBe(25);
  });
});

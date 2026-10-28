/// <reference types="jest" />

import { IModels } from '~/connectionResolvers';
import { ITransaction } from '~/modules/accounting/@types/transaction';
import { activeCost } from '~/modules/accounting/utils/inventories';
import { dealToMovementTrs } from '../dealToMovementTrs';

jest.mock('erxes-api-shared/utils', () => ({
  fixNum: (value: number) => value,
}));
jest.mock('~/modules/accounting/utils/inventories', () => ({
  activeCost: jest.fn(),
}));

const UNIT_COST_BY_PLACE: Record<string, number> = {
  'shop-a': 10,
  'shop-b': 20,
  'default-source': 30,
};

const run = async (
  dealLocationSide: 'source' | 'destination',
  deal: Record<string, unknown>,
) => {
  const createPTransaction = jest.fn();
  const models = {
    Transactions: {
      find: jest.fn().mockReturnValue({ lean: async () => [] }),
      createPTransaction,
    },
  } as unknown as IModels;

  await dealToMovementTrs({
    subdomain: 'tenant',
    models,
    userId: 'user',
    deal: { _id: 'deal', name: 'Deal', ...deal },
    config: {
      dateRule: 'alwaysNow',
      sourceAccountId: 'source-account',
      destinationAccountId: 'destination-account',
      defaultSourcePlaceEntityId: 'default-source',
      defaultDestinationPlaceEntityId: 'default-destination',
      dealLocationSide,
    },
  });

  const [[moveTr]] = createPTransaction.mock.calls[0] as [ITransaction[]];

  return moveTr;
};

const line = (productId: string, extra: Record<string, unknown> = {}) => ({
  productId,
  quantity: 2,
  tickUsed: true,
  ...extra,
});

beforeEach(() => {
  jest
    .mocked(activeCost)
    .mockImplementation(async (_models, _account, placeEntityId, ids = []) =>
      Object.fromEntries(
        ids.map((id) => [
          id,
          {
            unitCost: UNIT_COST_BY_PLACE[placeEntityId || ''] ?? 0,
            totalCost: 0,
            remainder: 0,
          },
        ]),
      ),
    );
});

describe('deal movement places come from product lines', () => {
  it('moves each line out of its own place and keeps its responsible node', async () => {
    const moveTr = await run('source', {
      entityIds: ['sales-team'],
      productsData: [
        line('p1', {
          placeEntityId: 'shop-a',
          responsibleEntityId: 'team-a',
        }),
        line('p2', {
          placeEntityId: 'shop-b',
          responsibleEntityId: 'team-b',
        }),
      ],
    });

    expect(
      moveTr.details.map(
        ({ placeEntityId, responsibleEntityId, amount, followInfos }) => ({
          placeEntityId,
          responsibleEntityId,
          amount,
          moveIn: followInfos?.moveInPlaceEntityId,
        }),
      ),
    ).toEqual([
      {
        placeEntityId: 'shop-a',
        responsibleEntityId: 'team-a',
        amount: 20,
        moveIn: 'default-destination',
      },
      {
        placeEntityId: 'shop-b',
        responsibleEntityId: 'team-b',
        amount: 40,
        moveIn: 'default-destination',
      },
    ]);
    expect(moveTr).toMatchObject({
      placeEntityId: 'shop-a',
      responsibleEntityId: 'team-a',
    });
  });

  it('never takes a place or responsible node from deal entityIds', async () => {
    const moveTr = await run('source', {
      entityIds: ['sales-team'],
      productsData: [line('p1')],
    });

    expect(moveTr).toMatchObject({ placeEntityId: 'default-source' });
    expect(moveTr.responsibleEntityId).toBeUndefined();
    expect(moveTr.details[0]).toMatchObject({
      placeEntityId: 'default-source',
      amount: 60,
    });
    expect(moveTr.details[0].responsibleEntityId).toBeUndefined();
  });

  it('puts the line place on the destination side when configured', async () => {
    const moveTr = await run('destination', {
      productsData: [line('p1', { placeEntityId: 'shop-b' })],
    });

    expect(moveTr.details[0]).toMatchObject({
      placeEntityId: 'default-source',
      amount: 60,
      followInfos: { moveInPlaceEntityId: 'shop-b' },
    });
  });
});

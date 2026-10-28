import { JOURNALS } from '@/accounting/@types/constants';

import {
  buildFixedAssetLocationRemainderRows,
  getFixedAssetRemainderExclusionFilter,
} from '../fixedAssets';

describe('getFixedAssetRemainderExclusionFilter', () => {
  it('excludes the whole parent workflow for an edited transaction', () => {
    expect(
      getFixedAssetRemainderExclusionFilter(
        { _id: 'out-1', parentId: 'parent-1' },
        'out-1',
      ),
    ).toEqual({ parentId: { $ne: 'parent-1' } });
  });

  it('falls back to the transaction id when the transaction is unavailable', () => {
    expect(getFixedAssetRemainderExclusionFilter(null, 'out-1')).toEqual({
      _id: { $ne: 'out-1' },
    });
  });
});

describe('buildFixedAssetLocationRemainderRows', () => {
  it('groups fixed asset movement quantities by fixed asset, branch, and department', () => {
    const rows = buildFixedAssetLocationRemainderRows({
      fixedAssetIds: ['asset-a', 'asset-b'],
      transactions: [
        {
          journal: JOURNALS.FXA_INCOME,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 5 }],
        },
        {
          journal: JOURNALS.FXA_OUT,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 2 }],
        },
        {
          journal: JOURNALS.FXA_MOVE,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 1 }],
        },
        {
          journal: JOURNALS.FXA_MOVE_IN,
          placeEntityId: 'branch-b',
          responsibleEntityId: 'department-b',
          details: [{ fixedAssetId: 'asset-a', count: 1 }],
        },
        {
          journal: JOURNALS.FXA_INCOME,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-b', count: 4 }],
        },
        {
          journal: JOURNALS.MAIN,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 10 }],
        },
      ],
    });

    expect(rows).toEqual([
      {
        fixedAssetId: 'asset-a',
        placeEntityId: 'branch-a',
        responsibleEntityId: 'department-a',
        remainder: 2,
      },
      {
        fixedAssetId: 'asset-a',
        placeEntityId: 'branch-b',
        responsibleEntityId: 'department-b',
        remainder: 1,
      },
      {
        fixedAssetId: 'asset-b',
        placeEntityId: 'branch-a',
        responsibleEntityId: 'department-a',
        remainder: 4,
      },
    ]);
  });

  it('applies location filters and excludes depleted balances', () => {
    const rows = buildFixedAssetLocationRemainderRows({
      placeEntityId: 'branch-b',
      responsibleEntityId: 'department-b',
      fixedAssetIds: ['asset-a', 'asset-b'],
      transactions: [
        {
          journal: JOURNALS.FXA_INCOME,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 2 }],
        },
        {
          journal: JOURNALS.FXA_OUT,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 2 }],
        },
        {
          journal: JOURNALS.FXA_INCOME,
          placeEntityId: 'branch-b',
          responsibleEntityId: 'department-b',
          details: [{ fixedAssetId: 'asset-b', count: 3 }],
        },
      ],
    });

    expect(rows).toEqual([
      {
        fixedAssetId: 'asset-b',
        placeEntityId: 'branch-b',
        responsibleEntityId: 'department-b',
        remainder: 3,
      },
    ]);
  });

  it('can explicitly match empty branch and department locations', () => {
    const rows = buildFixedAssetLocationRemainderRows({
      placeEntityId: '',
      responsibleEntityId: '',
      fixedAssetIds: ['asset-a'],
      transactions: [
        {
          journal: JOURNALS.FXA_INCOME,
          details: [{ fixedAssetId: 'asset-a', count: 1 }],
        },
        {
          journal: JOURNALS.FXA_INCOME,
          placeEntityId: 'branch-a',
          responsibleEntityId: 'department-a',
          details: [{ fixedAssetId: 'asset-a', count: 5 }],
        },
      ],
    });

    expect(rows).toEqual([
      {
        fixedAssetId: 'asset-a',
        placeEntityId: '',
        responsibleEntityId: '',
        remainder: 1,
      },
    ]);
  });
});

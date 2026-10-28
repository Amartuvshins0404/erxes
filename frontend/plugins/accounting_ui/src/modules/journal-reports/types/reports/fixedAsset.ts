import { IReportConfig } from './common';

export const fixedAssetReportRules: Record<string, IReportConfig> = {
  fxa: {
    title: 'fixed-asset-report',
    colCount: 9,
    choices: [
      { code: 'fixedAsset', title: 'by-asset' },
      { code: 'accountFixedAsset', title: 'account-asset' },
      { code: 'placeResponsibleFixedAsset', title: 'place-responsible-asset' },
    ],
    groups: {
      fixedAsset: {
        group: 'fixedAssetId',
        code: 'fixedAssetCode',
        name: 'fixedAssetName',
        from: ['details'],
        groupRule: null,
      },
      accountFixedAsset: {
        group: 'accountId',
        code: 'accountCode',
        name: 'accountName',
        from: ['details'],
        style: 'font-semibold',
        groupRule: {
          group: 'fixedAssetId',
          code: 'fixedAssetCode',
          name: 'fixedAssetName',
          from: ['details'],
          groupRule: null,
        },
      },
      placeResponsibleFixedAsset: {
        group: 'placeEntityId',
        code: 'placeEntityCode',
        name: 'placeEntityName',
        style: 'font-semibold',
        groupRule: {
          group: 'responsibleEntityId',
          code: 'responsibleEntityCode',
          name: 'responsibleEntityName',
          style: 'font-semibold',
          groupRule: {
            group: 'fixedAssetId',
            code: 'fixedAssetCode',
            name: 'fixedAssetName',
            from: ['details'],
            groupRule: null,
          },
        },
      },
    },
  },
};

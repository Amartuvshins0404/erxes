import { IReportConfig } from './common';

export const fundReportRules: Record<string, IReportConfig> = {
  fund: {
    title: 'cash-and-bank-report',
    colCount: 6,
    choices: [
      { code: 'default', title: 'by-account' },
      { code: 'cat', title: 'by-account-category' },
      { code: 'placeResponsible', title: 'by-place-and-responsible' },
      { code: 'responsiblePlace', title: 'by-responsible-and-place' },
    ],
    groups: {
      default: {
        group: 'accountId',
        code: 'accountCode',
        name: 'accountName',
        from: ['details'],
        style: 'font-semibold bg-[#fefef1]',
        groupRule: null,
      },
      cat: {
        group: 'accountCategoryId',
        code: 'accountCategoryCode',
        name: 'accountCategoryName',
        excMore: true,
        style: 'font-semibold',
        groupRule: {
          group: 'accountId',
          code: 'accountCode',
          name: 'accountName',
          from: ['details'],
          style: 'font-semibold bg-[#fefef1]',
          groupRule: null,
        },
      },
      placeResponsible: {
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
            group: 'accountId',
            code: 'accountCode',
            name: 'accountName',
            from: ['details'],
            style: 'font-semibold bg-[#fefef1]',
            groupRule: null,
          },
        },
      },
      responsiblePlace: {
        group: 'responsibleEntityId',
        code: 'responsibleEntityCode',
        name: 'responsibleEntityName',
        style: 'font-semibold',
        groupRule: {
          group: 'placeEntityId',
          code: 'placeEntityCode',
          name: 'placeEntityName',
          style: 'font-semibold',
          groupRule: {
            group: 'accountId',
            code: 'accountCode',
            name: 'accountName',
            from: ['details'],
            style: 'font-semibold bg-[#fefef1]',
            groupRule: null,
          },
        },
      },
    },
  },
};

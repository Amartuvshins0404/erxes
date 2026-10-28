import { getDealOwner } from './utils';
import { fixNum } from 'erxes-api-shared/utils';
import { nanoid } from 'nanoid';
import { IModels } from '~/connectionResolvers';
import {
  JOURNALS,
  TR_SIDES,
  TR_STATUSES,
} from '~/modules/accounting/@types/constants';
import { ITransaction } from '~/modules/accounting/@types/transaction';
import { activeCost } from '~/modules/accounting/utils/inventories';
import { getDealAccountingDate } from './dealDate';

type TLocationSide = 'source' | 'destination';

type TDealProductData = {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  tickUsed?: boolean;
  currency?: string;
  placeEntityId?: string;
  responsibleEntityId?: string;
};

type TDealMovementConfig = {
  dateRule: 'alwaysNow' | 'syncedDateOrNow';
  responseFieldId?: string;
  sourceAccountId: string;
  destinationAccountId: string;
  defaultSourcePlaceEntityId?: string;
  defaultDestinationPlaceEntityId?: string;
  dealLocationSide: TLocationSide;
  trStatus?: string;
};

type TDealForMovement = {
  _id: string;
  number?: string;
  name?: string;
  createdAt?: string | Date;
  stageChangedDate?: string | Date;
  closeDate?: string | Date;
  productsData?: TDealProductData[];
  assignedUserIds?: string[];
  customerId?: string | null;
  companyId?: string | null;
};

type TMovementProductRow = {
  productData: TDealProductData;
  count: number;
  sourcePlaceEntityId?: string;
  destinationPlaceEntityId?: string;
};

const getProductLocation = ({
  config,
  productData,
}: {
  config: TDealMovementConfig;
  productData: TDealProductData;
}) => {
  const linePlaceEntityId = productData.placeEntityId;

  if (config.dealLocationSide === 'destination') {
    return {
      sourcePlaceEntityId: config.defaultSourcePlaceEntityId,
      destinationPlaceEntityId:
        linePlaceEntityId || config.defaultDestinationPlaceEntityId,
    };
  }

  return {
    sourcePlaceEntityId: linePlaceEntityId || config.defaultSourcePlaceEntityId,
    destinationPlaceEntityId: config.defaultDestinationPlaceEntityId,
  };
};

export const dealToMovementTrs = async ({
  models,
  userId,
  deal,
  config,
  dateType,
}: {
  subdomain: string;
  models: IModels;
  userId?: string;
  deal: TDealForMovement;
  dateType?: string;
  config: TDealMovementConfig;
}) => {
  const actingUserId = userId || '';
  const activeProductsData = deal.productsData?.filter(
    (productData) =>
      productData.tickUsed &&
      productData.productId &&
      productData.quantity &&
      productData.quantity > 0,
  );

  if (!activeProductsData?.length) {
    throw new Error(
      'Deal has no selected products with positive quantity for inventory movement.',
    );
  }

  let mainId = nanoid();
  let ptrId = nanoid();
  let parentId = mainId;

  const [contentType, contentId] = ['sales:deal', deal._id];
  const number = deal.number;

  const oldTrs = await models.Transactions.find({
    contentType,
    contentId,
    journal: JOURNALS.INV_MOVE,
  }).lean();

  if (oldTrs?.length) {
    const oldMoveTr = oldTrs[0];
    mainId = oldMoveTr?._id || mainId;
    ptrId = oldMoveTr?.ptrId || ptrId;
    parentId = oldMoveTr?.parentId || parentId;
  }

  const firstLocation = getProductLocation({
    config,
    productData: activeProductsData[0],
  });

  const date = getDealAccountingDate({
    deal,
    dateRule: config.dateRule,
    dateType,
    existingDate: oldTrs[0]?.date,
  });

  const movementRows = activeProductsData.map<TMovementProductRow>(
    (productData) => {
      return {
        productData,
        count: productData.quantity || 0,
        ...getProductLocation({ config, productData }),
      };
    },
  );

  const costsByLocation = new Map<
    string,
    Record<string, { totalCost: number; unitCost: number; remainder: number }>
  >();
  const excludedTransactionIds = oldTrs
    .map((transaction) => transaction._id)
    .filter(Boolean);
  const rowsByLocation = new Map<string, TMovementProductRow[]>();

  for (const row of movementRows) {
    const key = row.sourcePlaceEntityId || '';
    const rows = rowsByLocation.get(key) || [];

    rows.push(row);
    rowsByLocation.set(key, rows);
  }

  await Promise.all(
    [...rowsByLocation.entries()].map(async ([key, rows]) => {
      costsByLocation.set(
        key,
        await activeCost(
          models,
          config.sourceAccountId,
          rows[0].sourcePlaceEntityId,
          rows
            .map((row) => row.productData.productId)
            .filter((productId): productId is string => !!productId),
          excludedTransactionIds,
        ),
      );
    }),
  );

  const moveTrDoc: ITransaction = {
    _id: mainId,
    ptrId,
    parentId,
    number,
    date,
    description: deal.name,
    journal: JOURNALS.INV_MOVE,
    side: TR_SIDES.CREDIT,
    status: config.trStatus || TR_STATUSES.COMPLETE,
    followInfos: {
      moveInAccountId: config.destinationAccountId,
      moveInPlaceEntityId: firstLocation.destinationPlaceEntityId,
    },
    placeEntityId: firstLocation.sourcePlaceEntityId,
    responsibleEntityId: activeProductsData[0].responsibleEntityId,
    assignedUserIds: deal.assignedUserIds,
    contentType,
    contentId,
    details: [],
  };

  const owner = getDealOwner(deal);
  moveTrDoc.customerType = owner.customerType;
  moveTrDoc.customerId = owner.customerId;

  for (const row of movementRows) {
    const {
      productData,
      count,
      sourcePlaceEntityId,
      destinationPlaceEntityId,
    } = row;
    const cost = costsByLocation.get(sourcePlaceEntityId || '')?.[
      productData.productId || ''
    ];
    const unitPrice = fixNum(cost?.unitCost ?? 0, 6);
    const amount = fixNum(count * unitPrice, 4);

    moveTrDoc.details.push({
      _id: nanoid(),
      accountId: config.sourceAccountId,
      amount,
      currency: productData.currency,
      productId: productData.productId,
      count,
      unitPrice,
      placeEntityId: sourcePlaceEntityId,
      responsibleEntityId: productData.responsibleEntityId,
      followInfos: {
        moveInPlaceEntityId: destinationPlaceEntityId,
      },
    });
  }

  if (oldTrs.length) {
    await models.Transactions.updatePTransaction(
      parentId,
      [moveTrDoc],
      actingUserId,
      { skipAccountPermission: true },
    );
  } else {
    await models.Transactions.createPTransaction([moveTrDoc], actingUserId, {
      skipAccountPermission: true,
    });
  }
};

import { sendTRPCMessage } from 'erxes-api-shared/utils';
import fetch from 'node-fetch';
import { IModels } from '~/connectionResolvers';
import { IConfigDocument } from '~/modules/posclient/@types/configs';
import { IProductDocument } from '~/modules/posclient/@types/products';
import { debugError } from '~/modules/posclient/debugError';

export const getRemPlaceEntityId = (
  config: IConfigDocument,
  paramPlaceEntityId?: string,
) => {
  if (!paramPlaceEntityId) {
    return 'default';
  }

  if (config.placeEntityId === paramPlaceEntityId) {
    return 'default';
  }

  if (!(config.allowPlaceEntityIds || []).includes(paramPlaceEntityId)) {
    return 'default';
  }

  return paramPlaceEntityId;
};

const getRemainderScope = (
  config: IConfigDocument,
  paramPlaceEntityId?: string,
) => {
  const placeEntityIds = paramPlaceEntityId
    ? [paramPlaceEntityId]
    : config.isOnline
      ? config.allowPlaceEntityIds || []
      : (config.placeEntityId && [config.placeEntityId]) || [];

  return {
    placeEntityIds,
    responsibleEntityIds: config.responsibleEntityId
      ? [config.responsibleEntityId]
      : [],
  };
};

const calcRemainderFromInventories = (
  inventories: any = {},
  placeEntityIds: string[] = [],
  responsibleEntityIds: string[] = [],
) => {
  const result = {
    remainder: 0,
    soonIn: 0,
    soonOut: 0,
    remainders: [] as any[],
  };

  for (const placeEntityId of Object.keys(inventories || {})) {
    if (placeEntityIds.length && !placeEntityIds.includes(placeEntityId)) {
      continue;
    }

    for (const responsibleEntityId of Object.keys(
      inventories[placeEntityId] || {},
    )) {
      if (
        responsibleEntityIds.length &&
        !responsibleEntityIds.includes(responsibleEntityId)
      ) {
        continue;
      }

      const info = inventories[placeEntityId][responsibleEntityId] || {};
      const count = Number(info.remainder) || 0;
      const soonIn = Number(info.soonIn) || 0;
      const soonOut = Number(info.soonOut) || 0;

      result.remainder += count;
      result.soonIn += soonIn;
      result.soonOut += soonOut;
      result.remainders.push({
        placeEntityId,
        responsibleEntityId,
        count,
        soonIn,
        soonOut,
      });
    }
  }

  return result;
};

type ErkhetRemainderItem = {
  account: string;
  location: string;
  remainder: number;
};

type ErkhetRemainderByCode = Record<
  string,
  {
    rem: number;
    rems: ErkhetRemainderItem[];
  }
>;
type ErkhetRemainderResponse = Record<
  string,
  Record<string, Record<string, number>>
>;

type RemainderBulkOperation = {
  updateOne: {
    filter: { _id: string };
    update: { $set: Record<string, number> };
  };
};

export type ProductWithRemainder = IProductDocument & {
  remainders?: unknown[];
  remainder?: number;
  soonIn?: number;
  soonOut?: number;
  remainderByToken?: Record<string, Record<string, number>>;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErkhetRemainderUrl = (configuredUrl?: string) => {
  const url = configuredUrl || process.env.ERKHET_URL;

  if (!url) {
    return '';
  }

  return `${url}/get-api/`;
};

const fetchErkhetRemainders = async (
  config: IConfigDocument,
  products: ProductWithRemainder[],
): Promise<ErkhetRemainderResponse | undefined> => {
  const { erkhetConfig } = config;
  const accounts = erkhetConfig?.accounts || erkhetConfig?.account || '';
  const locations = erkhetConfig?.locations || erkhetConfig?.location || '';
  const apiKey = erkhetConfig?.apiKey || '';
  const apiSecret = erkhetConfig?.apiSecret || '';
  const requestUrl = getErkhetRemainderUrl(erkhetConfig?.getRemainderApiUrl);

  if (!requestUrl || !accounts || !locations || !apiKey || !apiSecret) {
    return undefined;
  }

  const url = new URL(requestUrl);
  url.search = new URLSearchParams({
    kind: 'remainder',
    api_key: apiKey,
    api_secret: apiSecret,
    check_relate: products.length < 4 ? '1' : '',
    accounts,
    locations,
    inventories: products.map((product) => product.code).join(','),
  }).toString();

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response.json();
};

const applyErkhetRemainders = async (
  models: IModels,
  config: IConfigDocument,
  products: ProductWithRemainder[],
  paramPlaceEntityId?: string,
) => {
  try {
    const jsonRes = await fetchErkhetRemainders(config, products);

    if (!jsonRes) {
      return products;
    }

    const responseByCode: ErkhetRemainderByCode = {};
    const accounts = (
      config.erkhetConfig?.accounts ||
      config.erkhetConfig?.account ||
      ''
    )
      .split(',')
      .map((account) => account.trim())
      .filter(Boolean);
    const locations = (
      config.erkhetConfig?.locations ||
      config.erkhetConfig?.location ||
      ''
    )
      .split(',')
      .map((location) => location.trim())
      .filter(Boolean);

    for (const account of accounts) {
      for (const location of locations) {
        const resp = jsonRes?.[account]?.[location] || {};

        for (const invCode of Object.keys(resp)) {
          if (!responseByCode[invCode]) {
            responseByCode[invCode] = { rem: 0, rems: [] };
          }

          const remainder = Number(resp[invCode]) || 0;

          responseByCode[invCode].rem += remainder;
          responseByCode[invCode].rems.push({
            account,
            location,
            remainder,
          });
        }
      }
    }

    const remPlaceEntityId = getRemPlaceEntityId(config, paramPlaceEntityId);
    const bulkOps: RemainderBulkOperation[] | undefined = config.saveRemainder
      ? []
      : undefined;

    for (const product of products) {
      const remainderInfo = responseByCode[product.code] || {
        rem: 0,
        rems: [],
      };

      product.remainders = remainderInfo.rems;
      product.remainder = remainderInfo.rem;
      product.soonIn = 0;
      product.soonOut = 0;

      if (!config.saveRemainder) {
        continue;
      }

      product.remainderByToken ??= {};
      product.remainderByToken[config.token] ??= {};

      product.remainderByToken[config.token][remPlaceEntityId] =
        product.remainder ?? 0;
      bulkOps?.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              [`remainderByToken.${config.token}.${remPlaceEntityId}`]:
                product.remainder ?? 0,
            },
          },
        },
      });
    }

    if (bulkOps?.length) {
      await models.Products.bulkWrite(bulkOps);
    }
  } catch (e) {
    debugError(`fetch remainder from erkhet, Error: ${getErrorMessage(e)}`);
  }

  return products;
};

const DISCOUNT_DEFAULT_KEY = '_';
type DiscountField = 'discount' | 'discountPercent';
type DiscountRangeOperator = '$gte' | '$lte';
type ProductFilter = Record<string, unknown>;
type DiscountConditions = Record<string, unknown>;

export const getDiscountScope = (
  config: IConfigDocument,
  paramPlaceEntityId?: string,
) => {
  const placeEntityId =
    paramPlaceEntityId &&
    (config.placeEntityId === paramPlaceEntityId ||
      (config.allowPlaceEntityIds || []).includes(paramPlaceEntityId))
      ? paramPlaceEntityId
      : config.placeEntityId;

  return {
    branchId: placeEntityId || DISCOUNT_DEFAULT_KEY,
    departmentId: config.responsibleEntityId || DISCOUNT_DEFAULT_KEY,
  };
};

const compactDiscountConditions = (conditions: DiscountConditions = {}) =>
  Object.entries(conditions).reduce<DiscountConditions>(
    (result, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return result;
      }

      result[key] = value;
      return result;
    },
    {},
  );

export const getDiscountConditions = (
  config: IConfigDocument,
  paramPlaceEntityId?: string,
  conditions: DiscountConditions = {},
) => {
  const { branchId, departmentId } = getDiscountScope(
    config,
    paramPlaceEntityId,
  );

  return compactDiscountConditions({
    ...conditions,
    branchId: conditions.branchId || branchId,
    departmentId: conditions.departmentId || departmentId,
  });
};

const isRangeCondition = (
  value: unknown,
): value is { start?: string | number; end?: string | number } =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const conditionMatches = (expected: unknown, actual: unknown) => {
  if (actual === undefined || actual === null) {
    return false;
  }

  if (Array.isArray(expected)) {
    return expected.includes(actual as never);
  }

  if (isRangeCondition(expected)) {
    const { start, end } = expected;
    const actualValue = actual as string | number;

    if (start !== undefined && actualValue < start) {
      return false;
    }

    if (end !== undefined && actualValue > end) {
      return false;
    }

    return true;
  }

  if (typeof expected === 'number' && typeof actual === 'number') {
    return actual >= expected;
  }

  return expected === actual;
};

export const getDiscount = (
  discounts: IProductDocument['discounts'],
  config: IConfigDocument,
  paramPlaceEntityId?: string,
  discountConditions?: DiscountConditions,
) => {
  const conditions = getDiscountConditions(
    config,
    paramPlaceEntityId,
    discountConditions,
  );

  return (discounts || [])
    .filter((discount) =>
      (discount.prefixes || []).every((prefix) =>
        conditionMatches(discount.conditions?.[prefix], conditions[prefix]),
      ),
    )
    .sort((a, b) => b.discount - a.discount)[0];
};

const getConditionValueExpression = (
  conditionsExpression,
  prefixExpression,
) => ({
  $first: {
    $map: {
      input: {
        $filter: {
          input: { $objectToArray: conditionsExpression },
          as: 'condition',
          cond: { $eq: ['$$condition.k', prefixExpression] },
        },
      },
      as: 'condition',
      in: '$$condition.v',
    },
  },
});

const getRuleConditionMatchExpression = (
  requestConditions: DiscountConditions,
) => {
  const requestConditionsExpression = { $literal: requestConditions };

  return {
    $allElementsTrue: {
      $map: {
        input: { $ifNull: ['$$discount.prefixes', []] },
        as: 'prefix',
        in: {
          $let: {
            vars: {
              requestValue: getConditionValueExpression(
                requestConditionsExpression,
                '$$prefix',
              ),
              ruleValue: getConditionValueExpression(
                { $ifNull: ['$$discount.conditions', {}] },
                '$$prefix',
              ),
            },
            in: {
              $and: [
                { $ne: ['$$requestValue', null] },
                {
                  $cond: [
                    { $isArray: '$$ruleValue' },
                    { $in: ['$$requestValue', '$$ruleValue'] },
                    {
                      $cond: [
                        { $eq: [{ $type: '$$ruleValue' }, 'object'] },
                        {
                          $and: [
                            {
                              $or: [
                                { $eq: ['$$ruleValue.start', null] },
                                {
                                  $gte: ['$$requestValue', '$$ruleValue.start'],
                                },
                              ],
                            },
                            {
                              $or: [
                                { $eq: ['$$ruleValue.end', null] },
                                { $lte: ['$$requestValue', '$$ruleValue.end'] },
                              ],
                            },
                          ],
                        },
                        {
                          $cond: [
                            {
                              $in: [
                                { $type: '$$ruleValue' },
                                ['int', 'long', 'double', 'decimal'],
                              ],
                            },
                            { $gte: ['$$requestValue', '$$ruleValue'] },
                            { $eq: ['$$ruleValue', '$$requestValue'] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };
};

const getMatchingDiscountsExpression = (conditions: DiscountConditions) => ({
  $filter: {
    input: { $ifNull: ['$discounts', []] },
    as: 'discount',
    cond: getRuleConditionMatchExpression(conditions),
  },
});

export const getDiscountValueExpression = (
  field: DiscountField,
  conditions: DiscountConditions,
) => ({
  $ifNull: [
    {
      $max: {
        $map: {
          input: getMatchingDiscountsExpression(conditions),
          as: 'discount',
          in: `$$discount.${field}`,
        },
      },
    },
    0,
  ],
});

export const isDiscountSortField = (sortField?: string) =>
  sortField === 'discount' || sortField === 'discountPercent';

const hasDiscountRangeValue = (value?: number | null): value is number =>
  value !== undefined && value !== null;

const buildDiscountRangeFilter = (
  field: DiscountField,
  operator: DiscountRangeOperator,
  value: number,
  conditions: DiscountConditions,
) => ({
  $expr: {
    [operator]: [getDiscountValueExpression(field, conditions), value],
  },
});

export const pushDiscountRangeFilters = (
  filters: ProductFilter[],
  config: IConfigDocument,
  placeEntityId: string | undefined,
  params: {
    minDiscountValue?: number | null;
    maxDiscountValue?: number | null;
    minDiscountPercent?: number | null;
    maxDiscountPercent?: number | null;
    discountConditions?: DiscountConditions;
  },
) => {
  const conditions = getDiscountConditions(
    config,
    placeEntityId,
    params.discountConditions,
  );

  const addRangeFilter = (
    field: DiscountField,
    operator: DiscountRangeOperator,
    value?: number | null,
  ) => {
    if (!hasDiscountRangeValue(value)) {
      return;
    }

    filters.push(buildDiscountRangeFilter(field, operator, value, conditions));
  };

  addRangeFilter('discount', '$gte', params.minDiscountValue);
  addRangeFilter('discount', '$lte', params.maxDiscountValue);
  addRangeFilter('discountPercent', '$gte', params.minDiscountPercent);
  addRangeFilter('discountPercent', '$lte', params.maxDiscountPercent);
};

export const getDiscountSortedProducts = async ({
  models,
  filter,
  config,
  params,
}: {
  models: IModels;
  filter: ProductFilter;
  config: IConfigDocument;
  params: {
    placeEntityId?: string;
    sortField?: string;
    sortDirection?: number;
    page?: number;
    perPage?: number;
    discountConditions?: DiscountConditions;
  };
}) => {
  const discountField =
    params.sortField === 'discountPercent' ? 'discountPercent' : 'discount';
  const sortDirection = params.sortDirection === -1 ? -1 : 1;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.perPage) || 20);
  const conditions = getDiscountConditions(
    config,
    params.placeEntityId,
    params.discountConditions,
  );

  return models.Products.aggregate([
    { $match: filter },
    {
      $addFields: {
        discountSortValue: getDiscountValueExpression(
          discountField,
          conditions,
        ),
      },
    },
    { $sort: { discountSortValue: sortDirection, code: 1, _id: 1 } },
    { $skip: (page - 1) * perPage },
    { $limit: perPage },
  ]);
};

export const checkRemainders = async (
  subdomain: string,
  models: IModels,
  config: IConfigDocument,
  checkProducts: IProductDocument[],
  paramPlaceEntityId?: string,
  forValidation = false,
) => {
  const products: ProductWithRemainder[] = checkProducts;

  if (!products.length) {
    return products;
  }

  if (config.isShowRemainder && config.erkhetConfig?.useRemainder) {
    return applyErkhetRemainders(models, config, products, paramPlaceEntityId);
  }

  if (
    !config.isShowRemainder &&
    !config.saveRemainder &&
    !(forValidation && config.isCheckRemainder)
  ) {
    return products;
  }

  const { placeEntityIds, responsibleEntityIds } = getRemainderScope(
    config,
    paramPlaceEntityId,
  );
  const productIds = products.map((p) => p._id);

  const coreProducts = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'products',
    action: 'find',
    input: {
      query: { _id: { $in: productIds } },
      fields: { inventories: 1 },
      limit: productIds.length,
    },
    defaultValue: [],
  });

  const coreProductsById = {};
  for (const coreProduct of coreProducts) {
    coreProductsById[coreProduct._id] = coreProduct;
  }

  const bulkOps:
    | Array<{
        updateOne: {
          filter: { _id: string };
          update: { $set: Record<string, number> };
        };
      }>
    | undefined = config.saveRemainder ? [] : undefined;
  const remPlaceEntityId = config.saveRemainder
    ? getRemPlaceEntityId(config, paramPlaceEntityId)
    : '';

  for (const product of products) {
    const remainderInfo = calcRemainderFromInventories(
      coreProductsById[product._id]?.inventories,
      placeEntityIds,
      responsibleEntityIds,
    );

    product.remainders = remainderInfo.remainders;
    product.remainder = remainderInfo.remainder;
    product.soonIn = remainderInfo.soonIn;
    product.soonOut = remainderInfo.soonOut;

    if (!config.saveRemainder) {
      continue;
    }

    product.remainderByToken ??= {};
    product.remainderByToken[config.token] ??= {};

    product.remainderByToken[config.token][remPlaceEntityId] =
      product.remainder ?? 0;
    bulkOps?.push({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            [`remainderByToken.${config.token}.${remPlaceEntityId}`]:
              product.remainder ?? 0,
          },
        },
      },
    });
  }

  if (bulkOps?.length) {
    await models.Products.bulkWrite(bulkOps);
  }

  return products;
};

export const syncRemainders = async (
  subdomain: string,
  models: IModels,
  config: IConfigDocument,
  products: IProductDocument[],
) => {
  const batchSize = 100;

  for (let i = 0; i < products.length; i += batchSize) {
    const checkProducts = products.slice(i, i + batchSize);
    for (const paramPlaceEntityId of config.allowPlaceEntityIds || []) {
      await checkRemainders(
        subdomain,
        models,
        config,
        checkProducts,
        paramPlaceEntityId,
      );
    }
    await checkRemainders(subdomain, models, config, checkProducts);
  }
};

export const syncDiscounts = async (
  subdomain: string,
  models: IModels,
  products: IProductDocument[],
) => {
  const batchSize = 100;

  for (let i = 0; i < products.length; i += batchSize) {
    const checkProducts = products.slice(i, i + batchSize);
    const productIds = checkProducts.map((product) => product._id);

    const coreProducts = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'products',
      action: 'find',
      input: {
        query: { _id: { $in: productIds } },
        fields: { discounts: 1 },
        limit: productIds.length,
      },
      defaultValue: [],
    });

    const coreProductsById = {};
    for (const coreProduct of coreProducts) {
      coreProductsById[coreProduct._id] = coreProduct;
    }

    const bulkOps = checkProducts.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            discounts: coreProductsById[product._id]?.discounts || [],
          },
        },
      },
    }));

    if (bulkOps.length) {
      await models.Products.bulkWrite(bulkOps);
    }
  }
};

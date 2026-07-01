import { AfterProcessConfigs, IAfterProcessRule } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';

const productMutationNames = ['productsAdd'];

const rules: IAfterProcessRule[] = [
  {
    type: 'afterMutation',
    mutationNames: productMutationNames,
  },
];

type MutationData = {
  mutationName?: string;
  result?: { _id?: string; code?: string };
};

export const afterProcess: AfterProcessConfigs = {
  rules,
  afterMutation: async (ctx, input) => {
    const { mutationName, result } = (input?.data || {}) as MutationData;

    if (!mutationName || !productMutationNames.includes(mutationName)) {
      return;
    }

    const { _id: productId, code } = result || {};

    if (!productId || !code) {
      return;
    }

    const models = await generateModels(ctx.subdomain);

    await models.ProductSpecification.linkByCode(code, productId);
  },
};

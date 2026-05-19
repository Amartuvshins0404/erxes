import { supplierMutations } from '@/supplier/graphql/resolvers/mutations/supplier';
import { collectiveMutations } from '@/collective/graphql/resolvers/mutations/collective';
import { collectiveOnly, supplierOnly } from '@/collective/utils/isCollective';

export const mutations = {
  ...supplierOnly(supplierMutations),
  ...collectiveOnly(collectiveMutations),
};

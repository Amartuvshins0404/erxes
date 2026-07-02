import { supplierMutations } from '@/supplier/graphql/resolvers/mutations/supplier';
import { productMutations } from '@/product/graphql/resolvers/mutations/product';
import { productSpecificationMutations } from '@/product-specification/graphql/resolvers/mutations/productSpecification';
import { configMutations } from '@/config/graphql/resolvers/mutations/config';
import { membershipMutations } from '@/membership/graphql/resolvers/mutations/mushopMembership';
import { membershipPlanMutations } from '@/membership/graphql/resolvers/mutations/mushopMembershipPlan';
import { collectiveMutations } from '@/collective/graphql/resolvers/mutations/collective';

export const mutations = {
  ...supplierMutations,
  ...productMutations,
  ...productSpecificationMutations,
  ...configMutations,
  ...membershipMutations,
  ...membershipPlanMutations,
  ...collectiveMutations,
};

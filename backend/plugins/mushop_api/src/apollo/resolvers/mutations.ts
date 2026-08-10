import { supplierMutations } from '@/supplier/graphql/resolvers/mutations/supplier';
import { orderMutations } from '@/supplier/graphql/resolvers/mutations/order';
import { productMutations } from '@/product/graphql/resolvers/mutations/product';
import { productSpecificationMutations } from '@/product-specification/graphql/resolvers/mutations/productSpecification';
import { configMutations } from '@/config/graphql/resolvers/mutations/config';
import { membershipMutations } from '@/membership/graphql/resolvers/mutations/mushopMembership';
import { membershipPlanMutations } from '@/membership/graphql/resolvers/mutations/mushopMembershipPlan';
import { collectiveMutations } from '@/collective/graphql/resolvers/mutations/collective';

export const mutations = {
  ...supplierMutations,
  ...orderMutations,
  ...productMutations,
  ...productSpecificationMutations,
  ...configMutations,
  ...membershipMutations,
  ...membershipPlanMutations,
  ...collectiveMutations,
};

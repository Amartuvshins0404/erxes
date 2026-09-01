import { agencyMutations } from '@/agency/graphql/resolvers/mutations/agency';
import { developerMutations } from '@/developer/graphql/resolvers/mutations/developer';
import { submissionMutation } from '@/form/graphql/mutations';
import { listingMutations } from '@/listing/graphql/resolvers/mutations/listing';
import { unitMutations } from '@/unit/graphql/resolvers/mutations/unit';
import { projectMutations } from '@/project/graphql/resolvers/mutations/project';
import { supplierMutations } from '@/supplier/profile/graphql/resolvers/mutations/supplier';
import { productMutations } from '@/supplier/product/graphql/resolvers/mutations/product';
import { membershipMutations } from '@/membership/graphql/resolvers/mutations/membership';
import { membershipPlanMutations } from '@/membership/graphql/resolvers/mutations/membershipPlan';
import { cpBlockMutations } from '~/modules/clientportal/graphql/resolvers/mutations';

export const mutations = {
  ...submissionMutation,
  ...agencyMutations,
  ...developerMutations,
  ...unitMutations,
  ...projectMutations,
  ...listingMutations,
  ...supplierMutations,
  ...productMutations,
  ...membershipMutations,
  ...membershipPlanMutations,
  ...cpBlockMutations,
};

import {
  mutations as SupplierMutations,
  queries as SupplierQueries,
  types as SupplierTypes,
} from '@/supplier/graphql/schemas/supplier';
import {
  mutations as ProductMutations,
  queries as ProductQueries,
  types as ProductTypes,
} from '@/product/graphql/schemas/product';
import {
  mutations as SubscriptionMutations,
  queries as SubscriptionQueries,
  types as SubscriptionTypes,
} from '@/subscription/graphql/schemas/mushopSubscription';
import {
  mutations as SubscriptionPlanMutations,
  queries as SubscriptionPlanQueries,
  types as SubscriptionPlanTypes,
} from '@/subscription/graphql/schemas/mushopSubscriptionPlan';
import {
  queries as CustomerInvoiceQueries,
  types as CustomerInvoiceTypes,
} from '@/subscription/graphql/schemas/invoices';
import {
  mutations as CollectiveMutations,
  queries as CollectiveQueries,
  types as CollectiveTypes,
} from '@/collective/graphql/schemas/collective';
import {
  mutations as CollectivePackageMutations,
  queries as CollectivePackageQueries,
  types as CollectivePackageTypes,
} from '@/collective-package/graphql/schemas/collectivePackage';
import { TypeExtensions } from './extensions';

export const types = `
  ${TypeExtensions}

  ${SupplierTypes}
  ${ProductTypes}
  ${SubscriptionTypes}
  ${SubscriptionPlanTypes}
  ${CustomerInvoiceTypes}
  ${CollectiveTypes}
  ${CollectivePackageTypes}
`;

export const queries = `
  ${SupplierQueries}
  ${ProductQueries}
  ${SubscriptionQueries}
  ${SubscriptionPlanQueries}
  ${CustomerInvoiceQueries}
  ${CollectiveQueries}
  ${CollectivePackageQueries}
`;

export const mutations = `
  ${SupplierMutations}
  ${ProductMutations}
  ${SubscriptionMutations}
  ${SubscriptionPlanMutations}
  ${CollectiveMutations}
  ${CollectivePackageMutations}
`;

export default { types, queries, mutations };

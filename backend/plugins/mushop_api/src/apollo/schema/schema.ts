import {
  mutations as SupplierMutations,
  queries as SupplierQueries,
  types as SupplierTypes,
} from '@/supplier/graphql/schemas/supplier';
import {
  mutations as OrderMutations,
  queries as OrderQueries,
  types as OrderTypes,
} from '@/supplier/graphql/schemas/order';
import {
  mutations as ProductMutations,
  queries as ProductQueries,
  types as ProductTypes,
} from '@/product/graphql/schemas/product';
import {
  mutations as ProductSpecificationMutations,
  queries as ProductSpecificationQueries,
  types as ProductSpecificationTypes,
} from '@/product-specification/graphql/schemas/productSpecification';
import {
  mutations as ConfigMutations,
  queries as ConfigQueries,
  types as ConfigTypes,
} from '@/config/graphql/schemas/config';
import {
  mutations as MembershipMutations,
  queries as MembershipQueries,
  types as MembershipTypes,
} from '@/membership/graphql/schemas/mushopMembership';
import {
  mutations as MembershipPlanMutations,
  queries as MembershipPlanQueries,
  types as MembershipPlanTypes,
} from '@/membership/graphql/schemas/mushopMembershipPlan';
import {
  queries as CustomerInvoiceQueries,
  types as CustomerInvoiceTypes,
} from '@/membership/graphql/schemas/invoices';
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
  ${OrderTypes}
  ${ProductTypes}
  ${ProductSpecificationTypes}
  ${ConfigTypes}
  ${MembershipTypes}
  ${MembershipPlanTypes}
  ${CustomerInvoiceTypes}
  ${CollectiveTypes}
  ${CollectivePackageTypes}
`;

export const queries = `
  ${SupplierQueries}
  ${OrderQueries}
  ${ProductQueries}
  ${ProductSpecificationQueries}
  ${ConfigQueries}
  ${MembershipQueries}
  ${MembershipPlanQueries}
  ${CustomerInvoiceQueries}
  ${CollectiveQueries}
  ${CollectivePackageQueries}
`;

export const mutations = `
  ${SupplierMutations}
  ${OrderMutations}
  ${ProductMutations}
  ${ProductSpecificationMutations}
  ${ConfigMutations}
  ${MembershipMutations}
  ${MembershipPlanMutations}
  ${CollectiveMutations}
  ${CollectivePackageMutations}
`;

export default { types, queries, mutations };

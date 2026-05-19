import {
  mutations as SupplierMutations,
  queries as SupplierQueries,
  types as SupplierTypes,
} from '@/supplier/graphql/schemas/supplier';
import {
  mutations as CollectiveMutations,
  queries as CollectiveQueries,
  types as CollectiveTypes,
} from '@/collective/graphql/schemas/collective';

export const types = `
  ${SupplierTypes}
  ${CollectiveTypes}
`;

export const queries = `
  ${SupplierQueries}
  ${CollectiveQueries}
`;

export const mutations = `
  ${SupplierMutations}
  ${CollectiveMutations}
`;

export default { types, queries, mutations };

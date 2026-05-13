import {
  mutations as BlockAgencyMutations,
  queries as BlockAgencyQueries,
  types as BlockAgencyTypes,
} from '~/modules/agency/graphql/schemas/agency';

import {
  mutations as BlockListingMutations,
  queries as BlockListingQueries,
  types as BlockListingTypes,
} from '~/modules/listing/graphql/schemas/listing';

import {
  mutations as BlockMemberMutations,
  queries as BlockMemberQueries,
  types as BlockMemberTypes,
} from '~/modules/member/graphql/schemas/member';

import {
  mutations as BlockUnitMutations,
  queries as BlockUnitQueries,
  types as BlockUnitTypes,
} from '~/modules/unit/graphql/schemas/unit';

export const types = `
  type User @key(fields: "_id") {
    _id: String @external
  }

  ${BlockAgencyTypes}
  ${BlockListingTypes}
  ${BlockMemberTypes}
  ${BlockUnitTypes}
`;

export const queries = `
  ${BlockAgencyQueries}
  ${BlockListingQueries}
  ${BlockMemberQueries}
  ${BlockUnitQueries}
`;

export const mutations = `
  ${BlockAgencyMutations}
  ${BlockListingMutations}
  ${BlockMemberMutations}
  ${BlockUnitMutations}
`;

export default { types, queries, mutations };

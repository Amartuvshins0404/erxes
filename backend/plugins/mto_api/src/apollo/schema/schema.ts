import {
  types as ProviderTypes,
  queries as ProviderQueries,
  mutations as ProviderMutations,
} from '@/provider/graphql/schemas/provider';

import {
  types as CategoryTypes,
  queries as CategoryQueries,
  mutations as CategoryMutations,
} from '@/category/graphql/schemas/category';

import {
  types as ConfigTypes,
  queries as ConfigQueries,
  mutations as ConfigMutations,
} from '@/config/graphql/schemas/config';


import {
  types as RegistrationTypes,
  queries as RegistrationQueries,
  mutations as RegistrationMutations,
} from '@/registration/graphql/schemas/registration';

import {
  types as EventTypes,
  queries as EventQueries,
  mutations as EventMutations,
} from '@/event/graphql/schemas/event';
import { TypeExtensions } from './extensions';

export const types = `
  ${TypeExtensions}
  ${ProviderTypes}
  ${CategoryTypes}
  ${ConfigTypes}
  ${EventTypes}
  ${RegistrationTypes}
`;

export const queries = `
  ${ProviderQueries}
  ${CategoryQueries}
  ${ConfigQueries}
  ${EventQueries}
  ${RegistrationQueries}
`;

export const mutations = `
  ${ProviderMutations}
  ${CategoryMutations}
  ${ConfigMutations}
  ${EventMutations}
  ${RegistrationMutations}
`;

export default { types, queries, mutations };

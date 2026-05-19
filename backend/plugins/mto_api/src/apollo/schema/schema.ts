import {
  types as ProviderTypes,
  queries as ProviderQueries,
  mutations as ProviderMutations,
} from '@/provider/graphql/schemas/provider';

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
import { TypeExtensions } from './extensions';

export const types = `
  ${TypeExtensions}
  ${ProviderTypes}
  ${ConfigTypes}
  ${RegistrationTypes}
`;

export const queries = `
  ${ProviderQueries}
  ${ConfigQueries}
  ${RegistrationQueries}
`;

export const mutations = `
  ${ProviderMutations}
  ${ConfigMutations}
  ${RegistrationMutations}
`;

export default { types, queries, mutations };

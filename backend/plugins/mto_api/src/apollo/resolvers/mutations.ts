import { providerMutations } from '@/provider/graphql/resolvers/mutations/provider';

import { configMutations } from '@/config/graphql/resolvers/mutations/config';


import { registrationMutations } from '@/registration/graphql/resolvers/mutations/registration';
import { registrationFormSchemaMutations } from '@/registration/graphql/resolvers/mutations/registrationFormSchemas';

export const mutations = Object.assign(
  {},
  providerMutations,
  configMutations,
  registrationMutations,
  registrationFormSchemaMutations,
);

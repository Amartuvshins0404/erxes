import { providerMutations } from '@/provider/graphql/resolvers/mutations/provider';
import { categoryMutations } from '@/category/graphql/resolvers/mutations/category';
import { eventMutations } from '@/event/graphql/resolvers/mutations/event';
import { travelAssociationMutations } from '@/travelAssociation/graphql/resolvers/mutations/travelAssociation';

import { configMutations } from '@/config/graphql/resolvers/mutations/config';


import { registrationMutations } from '@/registration/graphql/resolvers/mutations/registration';
import { registrationFormSchemaMutations } from '@/registration/graphql/resolvers/mutations/registrationFormSchemas';

export const mutations = Object.assign(
  {},
  providerMutations,
  configMutations,
  categoryMutations,
  eventMutations,
  travelAssociationMutations,
  registrationMutations,
  registrationFormSchemaMutations,
);

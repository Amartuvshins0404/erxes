import { providerQueries } from '@/provider/graphql/resolvers/queries/provider';
import { categoryQueries } from '@/category/graphql/resolvers/queries/category';
import { eventQueries } from '@/event/graphql/resolvers/queries/event';
import { travelAssociationQueries } from '@/travelAssociation/graphql/resolvers/queries/travelAssociation';

import { configQueries } from '@/config/graphql/resolvers/queries/config';
import { registrationQueries } from '@/registration/graphql/resolvers/queries/registration';

import { registrationApplicationsQueries } from '@/registration/graphql/resolvers/queries/registrationApplications';
import { registrationFormSchemaQueries } from '@/registration/graphql/resolvers/queries/registrationFormSchemas';

export const queries = {
  ...providerQueries,
  ...configQueries,
  ...categoryQueries,
  ...eventQueries,
  ...travelAssociationQueries,
  ...registrationQueries,
  ...registrationApplicationsQueries,
  ...registrationFormSchemaQueries,
};

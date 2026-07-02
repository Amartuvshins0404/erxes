import { providerQueries } from '@/provider/graphql/resolvers/queries/provider';
import { associationQueries } from '@/association/graphql/resolvers/queries/association';
import { eventQueries } from '@/event/graphql/resolvers/queries/event';

import { configQueries } from '@/config/graphql/resolvers/queries/config';
import { registrationQueries } from '@/registration/graphql/resolvers/queries/registration';

import { registrationApplicationsQueries } from '@/registration/graphql/resolvers/queries/registrationApplications';
import { registrationFormSchemaQueries } from '@/registration/graphql/resolvers/queries/registrationFormSchemas';

export const queries = {
  ...providerQueries,
  ...configQueries,
  ...associationQueries,
  ...eventQueries,
  ...registrationQueries,
  ...registrationApplicationsQueries,
  ...registrationFormSchemaQueries,
};

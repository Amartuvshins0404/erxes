import {
  supplierClientPortalQueries,
  supplierQueries,
} from '@/supplier/graphql/resolvers/queries/supplier';
import { collectiveQueries } from '@/collective/graphql/resolvers/queries/collective';
import { collectiveOnly, supplierOnly } from '@/collective/utils/isCollective';

export const queries = {
  ...supplierOnly(supplierQueries),
  ...collectiveOnly(collectiveQueries),
  ...supplierClientPortalQueries,
};

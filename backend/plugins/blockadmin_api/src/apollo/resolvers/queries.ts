import { agencyQueries } from '@/agency/graphql/resolvers/queries/agency';
import { attachmentQueries } from '@/attachment/graphql/resolvers/queries/attachment';
import { buildingQueries } from '@/building/graphql/resolvers/queries/building';
import { zoningQueries } from '@/building/graphql/resolvers/queries/zoning';
import { contractQueries } from '@/contract/graphql/resolvers/queries/contract';
import { offerQueries } from '@/contract/graphql/resolvers/queries/offer';
import { developerQueries } from '@/developer/graphql/resolvers/queries/developer';
import { documentQueries } from '@/document/graphql/resolvers/queries/document';
import { invoiceQueries } from '@/invoice/graphql/resolvers/queries/invoice';
import { projectMemberQueries } from '@/project/graphql/resolvers/queries/member';
import { paymentQueries } from '@/project/graphql/resolvers/queries/payment';
import { projectQueries } from '@/project/graphql/resolvers/queries/project';
import { unitQueries } from '@/unit/graphql/resolvers/queries/unit';
import { unitTypesQueries } from '@/unit/graphql/resolvers/queries/unitType';
import { unitLeadQueries } from '@/unit/graphql/resolvers/queries/unitLead';
import { cpBlockQueries } from '~/modules/clientportal/graphql/resolvers/queries';
import { formQueries } from '~/modules/form/graphql/queries';
import { listingQueries } from '@/listing/graphql/resolvers/queries/listing';
import { supplierQueries } from '@/supplier/profile/graphql/resolvers/queries/supplier';
import { productQueries } from '@/supplier/product/graphql/resolvers/queries/product';
import { membershipQueries } from '@/membership/graphql/resolvers/queries/membership';
import { membershipPlanQueries } from '@/membership/graphql/resolvers/queries/membershipPlan';

export const queries = {
  ...agencyQueries,
  ...projectQueries,
  ...buildingQueries,
  ...zoningQueries,
  ...paymentQueries,
  ...attachmentQueries,
  ...documentQueries,
  ...developerQueries,
  ...unitQueries,
  ...unitTypesQueries,
  ...projectMemberQueries,
  ...unitLeadQueries,
  ...contractQueries,
  ...offerQueries,
  ...invoiceQueries,
  ...formQueries,
  ...listingQueries,
  ...supplierQueries,
  ...productQueries,
  ...membershipQueries,
  ...membershipPlanQueries,

  ...cpBlockQueries,
};

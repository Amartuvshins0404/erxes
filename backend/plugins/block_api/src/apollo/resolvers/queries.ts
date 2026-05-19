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
import { unitLeadQueries } from '@/unit/graphql/resolvers/queries/unitLead';
import { unitTypesQueries } from '@/unit/graphql/resolvers/queries/unitType';
import { opptyQueries } from '@/oppty/graphql/queries/oppty';
import { blockNoteQueries } from '@/note/graphql/resolvers/queries/note';
import { statusQueries } from '@/oppty/graphql/queries/status';
import { contractStatusQueries } from '@/contract/graphql/resolvers/queries/status';
import { contractPaymentQueries } from '@/contract/graphql/resolvers/queries/payment';

export const queries = {
  ...blockNoteQueries,
  ...projectQueries,
  ...buildingQueries,
  ...zoningQueries,
  ...paymentQueries,
  ...attachmentQueries,
  ...documentQueries,
  ...developerQueries,
  ...unitQueries,
  ...projectMemberQueries,
  ...unitLeadQueries,
  ...contractQueries,
  ...offerQueries,
  ...invoiceQueries,
  ...unitTypesQueries,
  ...opptyQueries,
  ...statusQueries,
  ...contractStatusQueries,
  ...contractPaymentQueries,
};

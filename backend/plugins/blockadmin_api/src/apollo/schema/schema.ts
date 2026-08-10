import {
  mutations as ProjectMutations,
  queries as ProjectQueries,
  types as ProjectTypes,
} from '@/project/graphql/schemas/project';

import {
  queries as PaymentQueries,
  types as PaymentTypes,
} from '@/project/graphql/schemas/payment';

import {
  queries as BuildingQueries,
  types as BuildingTypes,
} from '@/building/graphql/schemas/building';

import {
  queries as DocumentQueries,
  types as DocumentTypes,
} from '@/document/graphql/schemas/document';

import {
  queries as UnitQueries,
  types as UnitTypes,
  mutations as UnitMutations,
} from '@/unit/graphql/schemas/unit';

import {
  queries as UnitTypeQueries,
  types as UnitTypeTypes,
} from '@/unit/graphql/schemas/unitType';

import {
  queries as ZoningQueries,
  types as ZoningTypes,
} from '@/building/graphql/schemas/zoning';

import {
  queries as AttachmentQueries,
  types as AttachmentTypes,
} from '@/attachment/graphql/schemas/attachment';

import {
  mutations as AgencyMutations,
  queries as AgencyQueries,
  types as AgencyTypes,
} from '@/agency/graphql/schemas/agency';
import {
  mutations as DeveloperMutations,
  queries as DeveloperQueries,
  types as DeveloperTypes,
} from '@/developer/graphql/schemas/developer';

import {
  queries as ProjectMemberQueries,
  types as ProjectMemberTypes,
} from '@/project/graphql/schemas/member';

import {
  queries as UnitLeadQueries,
  types as UnitLeadTypes,
} from '@/unit/graphql/schemas/unitLead';

import {
  queries as InvoiceQueries,
  types as InvoiceTypes,
} from '@/invoice/graphql/schemas/invoice';

import {
  queries as ContractQueries,
  types as ContractTypes,
} from '@/contract/graphql/schemas/contract';

import {
  queries as OfferQueries,
  types as OfferTypes,
} from '@/contract/graphql/schemas/offer';

import {
  queries as FormQueries,
  mutations as SubmissionMutations,
  types as SubmissionTypes,
} from '@/form/graphql/schemas';

import {
  mutations as ListingMutations,
  queries as ListingQueries,
  types as ListingTypes,
} from '@/listing/graphql/schemas/listing';

import {
  queries as ClientPortalBlockQueries,
  types as ClientPortalBlockTypes,
} from '~/modules/clientportal/graphql/schemas';

import {
  mutations as SupplierMutations,
  queries as SupplierQueries,
  types as SupplierTypes,
} from '@/supplier/profile/graphql/schemas/supplier';

import {
  mutations as ProductMutations,
  queries as ProductQueries,
  types as ProductTypes,
} from '@/supplier/product/graphql/schemas/product';

import {
  mutations as MembershipMutations,
  queries as MembershipQueries,
  types as MembershipTypes,
} from '@/membership/graphql/schemas/membership';

import {
  mutations as MembershipPlanMutations,
  queries as MembershipPlanQueries,
  types as MembershipPlanTypes,
} from '@/membership/graphql/schemas/membershipPlan';

import { TypeExtensions } from './extensions';

export const types = `
  ${TypeExtensions}
  ${ProjectTypes}
  ${PaymentTypes}
  ${BuildingTypes}
  ${DocumentTypes}
  ${UnitTypes}
  ${UnitTypeTypes}
  ${ZoningTypes}
  ${AttachmentTypes}
  ${AgencyTypes}
  ${DeveloperTypes}
  ${ProjectMemberTypes}
  ${UnitLeadTypes}
  ${InvoiceTypes}
  ${ContractTypes}
  ${OfferTypes}
  ${SubmissionTypes}
  ${ListingTypes}

  ${SupplierTypes}
  ${ProductTypes}
  ${MembershipTypes}
  ${MembershipPlanTypes}

  ${ClientPortalBlockTypes}
  `;

export const queries = `
  ${ProjectQueries}
  ${PaymentQueries}
  ${BuildingQueries}
  ${DocumentQueries}
  ${UnitQueries}
  ${UnitTypeQueries}
  ${ZoningQueries}
  ${AttachmentQueries}
  ${AgencyQueries}
  ${DeveloperQueries}
  ${ProjectMemberQueries}
  ${UnitLeadQueries}
  ${InvoiceQueries}
  ${ContractQueries}
  ${OfferQueries}
  ${FormQueries}
  ${ListingQueries}

  ${SupplierQueries}
  ${ProductQueries}
  ${MembershipQueries}
  ${MembershipPlanQueries}

  ${ClientPortalBlockQueries}
  `;

export const mutations = `
  ${SubmissionMutations}
  ${AgencyMutations}
  ${DeveloperMutations}
  ${UnitMutations}
  ${ProjectMutations}
  ${ListingMutations}

  ${SupplierMutations}
  ${ProductMutations}
  ${MembershipMutations}
  ${MembershipPlanMutations}
  `;

export default { types, queries, mutations };

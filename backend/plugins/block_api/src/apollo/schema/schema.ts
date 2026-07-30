import {
  mutations as ProjectMutations,
  queries as ProjectQueries,
  types as ProjectTypes,
} from '@/project/graphql/schemas/project';

import {
  mutations as PaymentMutations,
  queries as PaymentQueries,
  types as PaymentTypes,
} from '@/project/graphql/schemas/payment';

import {
  mutations as BuildingMutations,
  queries as BuildingQueries,
  types as BuildingTypes,
} from '@/building/graphql/schemas/building';

import {
  mutations as DocumentMutations,
  queries as DocumentQueries,
  types as DocumentTypes,
} from '@/document/graphql/schemas/document';

import {
  mutations as UnitMutations,
  queries as UnitQueries,
  types as UnitTypes,
} from '@/unit/graphql/schemas/unit';

import {
  mutations as ZoningMutations,
  queries as ZoningQueries,
  types as ZoningTypes,
} from '@/building/graphql/schemas/zoning';

import {
  mutations as AttachmentMutations,
  queries as AttachmentQueries,
  types as AttachmentTypes,
} from '@/attachment/graphql/schemas/attachment';

import {
  mutations as DeveloperMutations,
  queries as DeveloperQueries,
  types as DeveloperTypes,
} from '@/developer/graphql/schemas/developer';

import {
  mutations as ProjectMemberMutations,
  queries as ProjectMemberQueries,
  types as ProjectMemberTypes,
} from '@/project/graphql/schemas/member';

import {
  mutations as UnitLeadMutations,
  queries as UnitLeadQueries,
  types as UnitLeadTypes,
} from '@/unit/graphql/schemas/unitLead';

import {
  mutations as InvoiceMutations,
  queries as InvoiceQueries,
  types as InvoiceTypes,
} from '@/invoice/graphql/schemas/invoice';

import {
  mutations as ContractMutations,
  queries as ContractQueries,
  types as ContractTypes,
  filterInputTypes as ContractFilterTypes,
  contractOverviewType as ContractOverviewType,
} from '@/contract/graphql/schemas/contract';

import {
  mutations as OfferMutations,
  queries as OfferQueries,
  types as OfferTypes,
  filterInputTypes as OfferFilterTypes,
  offerStatsType as OfferStatsType,
} from '@/contract/graphql/schemas/offer';

import {
  mutations as UnitTypeMutations,
  queries as UnitTypeQueries,
  types as UnitTypeTypes,
} from '@/unit/graphql/schemas/unitType';

import {
  mutations as OpptyMutations,
  queries as OpptyQueries,
  types as OpptyTypes,
  opptyOverviewType as OpptyOverviewType,
} from '@/oppty/graphql/schemas/oppty';

import {
  types as NoteTypes,
  queries as NoteQueries,
  mutations as NoteMutations,
} from '@/note/graphql/schemas/note';

import {
  mutations as StatusMutations,
  queries as StatusQueries,
  types as StatusTypes,
} from '@/oppty/graphql/schemas/status';

import {
  mutations as ContractStatusMutations,
  queries as ContractStatusQueries,
  types as ContractStatusTypes,
} from '@/contract/graphql/schemas/status';

import {
  mutations as ContractPaymentMutations,
  queries as ContractPaymentQueries,
  types as ContractPaymentTypes,
} from '@/contract/graphql/schemas/payment';

export const types = `
  type DeveloperAddress {
    countryCode: String
    country: String
    postCode: String
    city: String
    city_district: String
    suburb: String
    road: String
    street: String
    building: String
    number: String
    other: String
  }

  type DeveloperLocation {
    type: String
    coordinates: [Int]
  }

  type DeveloperAddressInfo {
    location: DeveloperLocation
    address: DeveloperAddress
    short: String
  }

  input DeveloperLocationInput {
    type: String
    coordinates: [Int]
  }

  input DeveloperAddressInput {
    countryCode: String
    country: String
    postCode: String
    city: String
    city_district: String
    suburb: String
    road: String
    street: String
    building: String
    number: String
    other: String
  }

  input DeveloperAddressInfoInput {
    location: DeveloperLocationInput
    address: DeveloperAddressInput
    short: String
  }

  ${ProjectTypes}
  ${PaymentTypes}
  ${BuildingTypes}
  ${DocumentTypes}
  ${UnitTypes}
  ${ZoningTypes}
  ${AttachmentTypes}
  ${DeveloperTypes}
  ${ProjectMemberTypes}
  ${UnitLeadTypes}
  ${InvoiceTypes}
  ${ContractTypes}
  ${ContractFilterTypes}
  ${OfferFilterTypes}
  ${OfferTypes}
  ${OfferStatsType}
  ${ContractOverviewType}
  ${UnitTypeTypes}
  ${OpptyTypes}
  ${OpptyOverviewType}
  ${NoteTypes}
  ${StatusTypes}
  ${ContractStatusTypes}
  ${ContractPaymentTypes}
  `;

export const queries = `
  ${ProjectQueries}
  ${PaymentQueries}
  ${BuildingQueries}
  ${DocumentQueries}
  ${UnitQueries}
  ${ZoningQueries}
  ${AttachmentQueries}
  ${DeveloperQueries}
  ${ProjectMemberQueries}
  ${UnitLeadQueries}
  ${InvoiceQueries}
  ${ContractQueries}
  ${OfferQueries}
  ${UnitTypeQueries}
  ${OpptyQueries}
  ${NoteQueries}
  ${StatusQueries}
  ${ContractStatusQueries}
  ${ContractPaymentQueries}
  `;

export const mutations = `
  ${NoteMutations}
  ${ProjectMutations}
  ${PaymentMutations}
  ${BuildingMutations}
  ${DocumentMutations}
  ${UnitMutations}
  ${ZoningMutations}
  ${AttachmentMutations}
  ${DeveloperMutations}
  ${ProjectMemberMutations}
  ${UnitLeadMutations}
  ${InvoiceMutations}
  ${ContractMutations}
  ${OfferMutations}
  ${UnitTypeMutations}
  ${OpptyMutations}
  ${StatusMutations}
  ${ContractStatusMutations}
  ${ContractPaymentMutations}
  `;

export default { types, queries, mutations };

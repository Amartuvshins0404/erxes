import {
  queries as cpProjectQueries,
  types as cpProjectTypes,
} from './project';

import {
  queries as cpDeveloperQueries,
  types as cpDeveloperTypes,
} from './developer';

import {
  queries as cpBuildingQueries,
  types as cpBuildingTypes,
} from './building';

import { queries as cpUnitQueries, types as cpUnitTypes } from './unit';

import {
  queries as cpContractQueries,
  types as cpContractTypes,
} from './contract';

import { queries as cpAgencyQueries, types as cpAgencyTypes } from './agency';

import {
  queries as cpListingQueries,
  types as cpListingTypes,
} from './listing';
import { queries as cpOfferQueries, types as cpOfferTypes } from './offer';
import {
  mutations as cpPaymentMutations,
  types as cpPaymentTypes,
} from './payment';

export const types = `
    ${cpProjectTypes}
    ${cpDeveloperTypes}
    ${cpBuildingTypes}
    ${cpUnitTypes}
    ${cpContractTypes}
    ${cpAgencyTypes}
    ${cpListingTypes}
    ${cpOfferTypes}
    ${cpPaymentTypes}
`;

export const queries = `
    ${cpProjectQueries}
    ${cpDeveloperQueries}
    ${cpBuildingQueries}
    ${cpUnitQueries}
    ${cpContractQueries}
    ${cpAgencyQueries}
    ${cpListingQueries}
    ${cpOfferQueries}
`;

export const mutations = `
    ${cpPaymentMutations}
`;

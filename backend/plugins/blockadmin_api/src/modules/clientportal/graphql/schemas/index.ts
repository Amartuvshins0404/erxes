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

import {
  queries as cpOfferQueries,
  types as cpOfferTypes,
} from './offer';

export const types = `
    ${cpProjectTypes}
    ${cpDeveloperTypes}
    ${cpBuildingTypes}
    ${cpUnitTypes}
    ${cpContractTypes}
    ${cpOfferTypes}
`;

export const queries = `
    ${cpProjectQueries}
    ${cpDeveloperQueries}
    ${cpBuildingQueries}
    ${cpUnitQueries}
    ${cpContractQueries}
    ${cpOfferQueries}
`;

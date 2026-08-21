import { cpAgencyQueries } from './agency';
import { cpBuildingQueries } from './building';
import { cpContractQueries } from './contract';
import { cpDeveloperQueries } from './developer';
import { cpListingQueries } from './listing';
import { cpProjectQueries } from './project';
import { cpUnitQueries } from './unit';
import { cpOfferQueries } from './offer';

export const cpBlockQueries = {
  ...cpProjectQueries,
  ...cpDeveloperQueries,
  ...cpBuildingQueries,
  ...cpUnitQueries,
  ...cpContractQueries,
  ...cpAgencyQueries,
  ...cpListingQueries,
  ...cpOfferQueries,
};

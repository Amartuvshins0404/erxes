import { cpBuildingQueries } from './building';
import { cpContractQueries } from './contract';
import { cpDeveloperQueries } from './developer';
import { cpProjectQueries } from './project';
import { cpUnitQueries } from './unit';

export const cpBlockQueries = {
  ...cpProjectQueries,
  ...cpDeveloperQueries,
  ...cpBuildingQueries,
  ...cpUnitQueries,
  ...cpContractQueries,
};

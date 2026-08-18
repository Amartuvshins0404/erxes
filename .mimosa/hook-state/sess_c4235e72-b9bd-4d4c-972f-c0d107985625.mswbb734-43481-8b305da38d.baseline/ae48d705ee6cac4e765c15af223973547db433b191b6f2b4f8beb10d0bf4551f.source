import { useMutation } from '@apollo/client';
import {
  BLOCK_CREATE_BUILDING,
  BLOCK_CREATE_BUILDING_ZONING,
  BLOCK_UPDATE_BUILDING,
} from '../graphql/buildingMutations';

export const useBuildingsCreate = () => {
  const [createBuilding, { loading }] = useMutation(BLOCK_CREATE_BUILDING);
  return { createBuilding, loading };
};

export const useBuildingsUpdate = () => {
  const [updateBuilding, { loading }] = useMutation(BLOCK_UPDATE_BUILDING);
  return { updateBuilding, loading };
};

export const useBuildingsCreateZone = () => {
  const [createBuildingZone, { loading }] = useMutation(
    BLOCK_CREATE_BUILDING_ZONING,
  );
  return { createBuildingZone, loading };
};

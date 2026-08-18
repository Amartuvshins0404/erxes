import { useMutation } from '@apollo/client';
import { BLOCK_DELETE_BUILDING_ZONING } from '../graphql/buildingMutations';

export const useBuildingZoningRemove = () => {
  const [deleteBuildingZoning, { loading }] = useMutation(
    BLOCK_DELETE_BUILDING_ZONING,
  );

  return { deleteBuildingZoning, loading };
};

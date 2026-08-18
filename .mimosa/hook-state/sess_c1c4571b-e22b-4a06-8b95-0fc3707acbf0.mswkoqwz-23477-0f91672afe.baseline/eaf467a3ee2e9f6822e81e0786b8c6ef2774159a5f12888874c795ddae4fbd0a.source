import { useQuery } from '@apollo/client';
import {
  BLOCK_GET_BUILDING_LIST,
  BLOCK_GET_BUILDING_ZONINGS,
} from '@/building/graphql/buildingQueries';
import { IBuilding, IZoning } from '@/building/types/buildingTypes';

export const useBuildings = ({ projectId }: { projectId: string }) => {
  const { data, loading } = useQuery<{ blockAdminGetBuildings: IBuilding[] }>(
    BLOCK_GET_BUILDING_LIST,
    {
      variables: { project: projectId },
      skip: !projectId,
    },
  );
  return { buildings: data?.blockAdminGetBuildings, loading };
};

export const useBuildingZonings = ({
  buildingId,
  skip,
}: {
  buildingId: string;
  skip?: boolean;
}) => {
  const { data, loading } = useQuery<{ blockAdminGetBuildingZonings: IZoning[] }>(
    BLOCK_GET_BUILDING_ZONINGS,
    {
      variables: { building: buildingId },
      skip: !buildingId || skip,
    },
  );
  return { buildingZonings: data?.blockAdminGetBuildingZonings, loading };
};

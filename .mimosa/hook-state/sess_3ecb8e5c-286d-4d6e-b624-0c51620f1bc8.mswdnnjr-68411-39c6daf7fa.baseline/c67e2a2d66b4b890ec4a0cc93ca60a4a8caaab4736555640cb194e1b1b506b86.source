import {
  BLOCK_GET_BUILDING,
  BLOCK_GET_BUILDING_LIST,
  BLOCK_GET_BUILDING_ZONING,
  BLOCK_GET_BUILDING_ZONINGS,
} from '@/building/graphql/buildingQueries';
import { useQuery } from '@apollo/client';
import { IBuilding, IZoning } from '@/building/types/buildingTypes';

export const useBuilding = (id?: string | null) => {
  const { data, loading } = useQuery<{ blockGetBuilding: IBuilding }>(
    BLOCK_GET_BUILDING,
    { variables: { _id: id }, skip: !id },
  );
  return { building: data?.blockGetBuilding, loading };
};

export const useZoning = (id?: string | null) => {
  const { data, loading } = useQuery<{ blockGetBuildingZoning: IZoning }>(
    BLOCK_GET_BUILDING_ZONING,
    { variables: { _id: id }, skip: !id },
  );
  return { zoning: data?.blockGetBuildingZoning, loading };
};

export const useBuildings = ({ projectId }: { projectId: string }) => {
  const { data, loading } = useQuery<{ blockGetBuildings: IBuilding[] }>(
    BLOCK_GET_BUILDING_LIST,
    {
      variables: { project: projectId },
      skip: !projectId,
    },
  );
  return { buildings: data?.blockGetBuildings, loading };
};

export const useBuildingZonings = ({
  buildingId,
  skip,
}: {
  buildingId?: string | null;
  skip?: boolean;
}) => {
  const { data, loading } = useQuery<{ blockGetBuildingZonings: IZoning[] }>(
    BLOCK_GET_BUILDING_ZONINGS,
    {
      variables: { building: buildingId },
      skip: !buildingId || skip,
    },
  );
  return { buildingZonings: data?.blockGetBuildingZonings, loading };
};

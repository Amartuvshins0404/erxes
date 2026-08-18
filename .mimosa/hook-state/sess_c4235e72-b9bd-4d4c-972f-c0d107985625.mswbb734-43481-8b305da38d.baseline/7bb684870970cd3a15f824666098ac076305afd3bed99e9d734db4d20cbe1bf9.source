import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { IBuilding, IZoning } from '@/building/types/buildingTypes';
import {
  BLOCK_UPDATE_BUILDING,
  BLOCK_UPDATE_BUILDING_ZONING,
} from '../graphql/buildingMutations';

export const useBuildingUpdate = ({ id }: { id: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_UPDATE_BUILDING);
  const updateBuilding = (input: Partial<IBuilding>) => {
    mutate({
      variables: { id, input },
      update: (cache, { data: { blockUpdateBuilding } }) => {
        cache.modify({
          id: cache.identify(blockUpdateBuilding),
          fields: Object.keys(input).reduce(
            (fields: Record<string, () => any>, field) => {
              fields[field] = () => input[field as keyof IBuilding];
              return fields;
            },
            {},
          ),
        });
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Building updated successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  return { updateBuilding, loading };
};

export const useBuildingZoningUpdate = ({ id }: { id: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_UPDATE_BUILDING_ZONING);
  const updateBuildingZoning = (input: Partial<IZoning>) => {
    mutate({
      variables: { id, input },
      update: (cache, { data: { blockUpdateBuildingZoning } }) => {
        cache.modify({
          id: cache.identify(blockUpdateBuildingZoning),
          fields: Object.keys(input).reduce(
            (fields: Record<string, () => any>, field) => {
              fields[field] = () => input[field as keyof IZoning];
              return fields;
            },
            {},
          ),
        });
      },
    });
  };
  return { updateBuildingZoning, loading };
};

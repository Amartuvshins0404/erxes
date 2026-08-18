import { ApolloCache, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

import {
  ADD_CAR_CATEGORY_MUTATION,
  ADD_CAR_MUTATION,
  EDIT_CAR_CATEGORY_MUTATION,
  EDIT_CAR_MUTATION,
  MERGE_CARS_MUTATION,
  REMOVE_CAR_CATEGORY_MUTATION,
  REMOVE_CARS_MUTATION,
} from '~/graphql/documents';

const activeRefetchQueries = 'active' as const;

const removeCarsFromCache = (
  cache: ApolloCache<unknown>,
  carIds: string[] = [],
) => {
  const carIdSet = new Set(carIds.filter(Boolean));

  if (!carIdSet.size) {
    return;
  }

  cache.modify({
    fields: {
      carsMain(existing = {}, { readField }) {
        const list = (existing as { list?: readonly unknown[] }).list;

        if (!Array.isArray(list)) {
          return existing;
        }

        const nextList = list.filter((carRef) => {
          const carId = readField<string>('_id', carRef);
          return !carId || !carIdSet.has(carId);
        });

        if (nextList.length === list.length) {
          return existing;
        }

        const existingTotalCount =
          (existing as { totalCount?: number }).totalCount || 0;

        return {
          ...(existing as Record<string, unknown>),
          list: nextList,
          totalCount: Math.max(
            0,
            existingTotalCount - (list.length - nextList.length),
          ),
        };
      },
      cars(existing, { readField }) {
        if (!Array.isArray(existing)) {
          return existing;
        }

        return existing.filter((carRef) => {
          const carId = readField<string>('_id', carRef);
          return !carId || !carIdSet.has(carId);
        });
      },
    },
  });

  carIdSet.forEach((carId) => {
    const cacheId = cache.identify({ __typename: 'Car', _id: carId });

    if (cacheId) {
      cache.evict({ id: cacheId });
    }
  });

  cache.gc();
};

export const useCarMutations = () => {
  const { t } = useTranslation('car');

  const [carsAdd, carsAddState] = useMutation(ADD_CAR_MUTATION, {
    refetchQueries: activeRefetchQueries,
    onCompleted: () => {
      toast({
        title: t('Car saved', { defaultValue: 'Car saved' }),
        description: t('The car record has been created successfully.', {
          defaultValue: 'The car record has been created successfully.',
        }),
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: t('Could not save car', {
          defaultValue: 'Could not save car',
        }),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [carsEdit, carsEditState] = useMutation(EDIT_CAR_MUTATION, {
    refetchQueries: activeRefetchQueries,
    onCompleted: () => {
      toast({
        title: t('Car updated', { defaultValue: 'Car updated' }),
        description: t('The car record has been updated successfully.', {
          defaultValue: 'The car record has been updated successfully.',
        }),
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: t('Could not update car', {
          defaultValue: 'Could not update car',
        }),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [carsRemove, carsRemoveState] = useMutation(REMOVE_CARS_MUTATION, {
    refetchQueries: activeRefetchQueries,
    awaitRefetchQueries: true,
    update: (cache, _result, { variables }) => {
      removeCarsFromCache(cache, variables?.carIds as string[] | undefined);
    },
    onCompleted: () => {
      toast({
        title: t('Cars deleted', { defaultValue: 'Cars deleted' }),
        description: t('Selected cars have been removed.', {
          defaultValue: 'Selected cars have been removed.',
        }),
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: t('Could not delete cars', {
          defaultValue: 'Could not delete cars',
        }),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [carsMerge, carsMergeState] = useMutation(MERGE_CARS_MUTATION, {
    refetchQueries: activeRefetchQueries,
    onCompleted: () => {
      toast({
        title: t('Cars merged', { defaultValue: 'Cars merged' }),
        description: t('The selected cars have been merged successfully.', {
          defaultValue: 'The selected cars have been merged successfully.',
        }),
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: t('Could not merge cars', {
          defaultValue: 'Could not merge cars',
        }),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [carCategoriesAdd, carCategoriesAddState] = useMutation(
    ADD_CAR_CATEGORY_MUTATION,
    {
      refetchQueries: activeRefetchQueries,
      onCompleted: () => {
        toast({
          title: t('Category saved', { defaultValue: 'Category saved' }),
          description: t('The category has been created successfully.', {
            defaultValue: 'The category has been created successfully.',
          }),
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: t('Could not save category', {
            defaultValue: 'Could not save category',
          }),
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  const [carCategoriesEdit, carCategoriesEditState] = useMutation(
    EDIT_CAR_CATEGORY_MUTATION,
    {
      refetchQueries: activeRefetchQueries,
      onCompleted: () => {
        toast({
          title: t('Category updated', { defaultValue: 'Category updated' }),
          description: t('The category has been updated successfully.', {
            defaultValue: 'The category has been updated successfully.',
          }),
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: t('Could not update category', {
            defaultValue: 'Could not update category',
          }),
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  const [carCategoriesRemove, carCategoriesRemoveState] = useMutation(
    REMOVE_CAR_CATEGORY_MUTATION,
    {
      refetchQueries: activeRefetchQueries,
      onCompleted: () => {
        toast({
          title: t('Category deleted', { defaultValue: 'Category deleted' }),
          description: t('The category has been removed.', {
            defaultValue: 'The category has been removed.',
          }),
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: t('Could not delete category', {
            defaultValue: 'Could not delete category',
          }),
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  return {
    carsAdd,
    carsEdit,
    carsRemove,
    carsMerge,
    carCategoriesAdd,
    carCategoriesEdit,
    carCategoriesRemove,
    loading:
      carsAddState.loading ||
      carsEditState.loading ||
      carsRemoveState.loading ||
      carsMergeState.loading ||
      carCategoriesAddState.loading ||
      carCategoriesEditState.loading ||
      carCategoriesRemoveState.loading,
  };
};

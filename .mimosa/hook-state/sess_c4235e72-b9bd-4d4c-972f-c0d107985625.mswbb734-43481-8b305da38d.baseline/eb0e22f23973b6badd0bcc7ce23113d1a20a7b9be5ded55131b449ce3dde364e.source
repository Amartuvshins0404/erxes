import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_ACTIVITY_CATEGORY_CREATE,
  ONE_FIT_ACTIVITY_CATEGORY_UPDATE,
  ONE_FIT_ACTIVITY_CATEGORIES_REMOVE,
} from '../graphql/categoryMutations';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '../graphql/categoryQueries';

export function useCreateCategory() {
  const [createCategoryMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_CATEGORY_CREATE,
  );

  const createCategory = (options: MutationFunctionOptions) => {
    return createCategoryMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_CATEGORIES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createCategory, loading };
}

export function useUpdateCategory() {
  const [updateCategoryMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_CATEGORY_UPDATE,
  );

  const updateCategory = (options: MutationFunctionOptions) => {
    return updateCategoryMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_CATEGORIES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateCategory, loading };
}

export function useRemoveCategories() {
  const [removeCategoriesMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_CATEGORIES_REMOVE,
  );

  const removeCategories = (ids: string[]) => {
    return removeCategoriesMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_CATEGORIES }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Categories removed successfully',
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

  return { removeCategories, loading };
}


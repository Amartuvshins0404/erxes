import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_ACTIVITY_TYPE_CREATE,
  ONE_FIT_ACTIVITY_TYPE_UPDATE,
  ONE_FIT_ACTIVITY_TYPES_REMOVE,
} from '../graphql/activityTypeMutations';
import { ONE_FIT_ACTIVITY_TYPES } from '../graphql/activityTypeQueries';

export function useCreateActivityType() {
  const [createActivityTypeMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_TYPE_CREATE,
  );

  const createActivityType = (options: MutationFunctionOptions) => {
    return createActivityTypeMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_TYPES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Activity type created successfully',
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

  return { createActivityType, loading };
}

export function useUpdateActivityType() {
  const [updateActivityTypeMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_TYPE_UPDATE,
  );

  const updateActivityType = (options: MutationFunctionOptions) => {
    return updateActivityTypeMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_TYPES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Activity type updated successfully',
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

  return { updateActivityType, loading };
}

export function useRemoveActivityTypes() {
  const [removeActivityTypesMutation, { loading }] = useMutation(
    ONE_FIT_ACTIVITY_TYPES_REMOVE,
  );

  const removeActivityTypes = (ids: string[]) => {
    return removeActivityTypesMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_ACTIVITY_TYPES }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Activity types removed successfully',
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

  return { removeActivityTypes, loading };
}










import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_PROVIDER_CREATE,
  ONE_FIT_PROVIDER_UPDATE,
  ONE_FIT_PROVIDER_APPROVE,
  ONE_FIT_PROVIDER_REJECT,
  ONE_FIT_PROVIDERS_REMOVE,
} from '../graphql/providerMutations';
import { ONE_FIT_PROVIDERS } from '../graphql/providerQueries';

export function useCreateProvider() {
  const [createProviderMutation, { loading }] = useMutation(
    ONE_FIT_PROVIDER_CREATE,
  );

  const createProvider = (options: MutationFunctionOptions) => {
    return createProviderMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROVIDERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Provider created successfully',
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

  return { createProvider, loading };
}

export function useUpdateProvider() {
  const [updateProviderMutation, { loading }] = useMutation(
    ONE_FIT_PROVIDER_UPDATE,
  );

  const updateProvider = (options: MutationFunctionOptions) => {
    return updateProviderMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROVIDERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Provider updated successfully',
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

  return { updateProvider, loading };
}

export function useApproveProvider() {
  const [approveProviderMutation, { loading }] = useMutation(
    ONE_FIT_PROVIDER_APPROVE,
  );

  const approveProvider = (options: MutationFunctionOptions) => {
    return approveProviderMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROVIDERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Provider approved successfully',
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

  return { approveProvider, loading };
}

export function useRejectProvider() {
  const [rejectProviderMutation, { loading }] = useMutation(
    ONE_FIT_PROVIDER_REJECT,
  );

  const rejectProvider = (options: MutationFunctionOptions) => {
    return rejectProviderMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROVIDERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Provider rejected successfully',
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

  return { rejectProvider, loading };
}

export function useRemoveProviders() {
  const [removeProvidersMutation, { loading }] = useMutation(
    ONE_FIT_PROVIDERS_REMOVE,
  );

  const removeProviders = (ids: string[]) => {
    return removeProvidersMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_PROVIDERS }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Providers removed successfully',
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

  return { removeProviders, loading };
}

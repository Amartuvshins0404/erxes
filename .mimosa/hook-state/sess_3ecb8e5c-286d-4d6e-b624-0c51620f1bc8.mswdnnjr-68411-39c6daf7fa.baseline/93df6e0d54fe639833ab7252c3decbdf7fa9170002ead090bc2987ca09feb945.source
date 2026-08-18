import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_BANNER_CREATE,
  ONE_FIT_BANNER_UPDATE,
  ONE_FIT_BANNERS_REMOVE,
} from '../graphql/bannerMutations';
import { ONE_FIT_BANNERS } from '../graphql/bannerQueries';

export function useCreateBanner() {
  const [createBannerMutation, { loading }] = useMutation(
    ONE_FIT_BANNER_CREATE,
  );

  const createBanner = (options: MutationFunctionOptions) => {
    return createBannerMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_BANNERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Banner created successfully',
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

  return { createBanner, loading };
}

export function useUpdateBanner() {
  const [updateBannerMutation, { loading }] = useMutation(
    ONE_FIT_BANNER_UPDATE,
  );

  const updateBanner = (options: MutationFunctionOptions) => {
    return updateBannerMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_BANNERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Banner updated successfully',
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

  return { updateBanner, loading };
}

export function useRemoveBanners() {
  const [removeBannersMutation, { loading }] = useMutation(
    ONE_FIT_BANNERS_REMOVE,
  );

  const removeBanners = (options: MutationFunctionOptions) => {
    return removeBannersMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_BANNERS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Banner(s) removed successfully',
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

  return { removeBanners, loading };
}

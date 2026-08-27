import { useQuery } from '@apollo/client';

import { OROLTSOO_ADMIN_PROFILE_DETAIL } from '../graphql/queries/profileQueries';
import { IAdminProfile } from '../types/profile';

export const useAdminProfileDetail = (profileId?: string) => {
  const { data, loading, error } = useQuery<{
    oroltsooAdminProfileDetail: IAdminProfile;
  }>(OROLTSOO_ADMIN_PROFILE_DETAIL, {
    variables: { id: profileId },
    skip: !profileId,
  });

  return { profile: data?.oroltsooAdminProfileDetail, loading, error };
};

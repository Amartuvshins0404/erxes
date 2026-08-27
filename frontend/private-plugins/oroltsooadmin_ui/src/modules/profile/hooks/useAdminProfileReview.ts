import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';

import {
  OROLTSOO_ADMIN_PROFILE_REJECT,
  OROLTSOO_ADMIN_PROFILE_VERIFY,
} from '../graphql/mutations/profileMutations';
import { IAdminProfile } from '../types/profile';

const PROFILES_QUERY_NAME = 'OroltsooAdminProfiles';

export const useAdminProfileReview = () => {
  const { toast } = useToast();

  const [verify, { loading: verifying }] = useMutation<{
    oroltsooAdminProfileVerify: IAdminProfile;
  }>(OROLTSOO_ADMIN_PROFILE_VERIFY, {
    refetchQueries: [PROFILES_QUERY_NAME],
  });

  const [reject, { loading: rejecting }] = useMutation<{
    oroltsooAdminProfileReject: IAdminProfile;
  }>(OROLTSOO_ADMIN_PROFILE_REJECT, {
    refetchQueries: [PROFILES_QUERY_NAME],
  });

  const onError = (title: string) => (error: Error) =>
    toast({ title, description: error.message, variant: 'destructive' });

  const verifyProfile = (id: string, note?: string) =>
    verify({
      variables: { id, note },
      onCompleted: () =>
        toast({ title: 'Профайл баталгаажлаа', variant: 'success' }),
      onError: onError('Баталгаажуулж чадсангүй'),
    });

  const rejectProfile = (id: string, note?: string) =>
    reject({
      variables: { id, note },
      onCompleted: () =>
        toast({ title: 'Профайлаас татгалзлаа', variant: 'success' }),
      onError: onError('Татгалзаж чадсангүй'),
    });

  return { verifyProfile, rejectProfile, loading: verifying || rejecting };
};

import { useMutation } from '@apollo/client';
import { DELETE_CV_RISK_GROUP } from '../graphql/cvRiskGroupsMutation';

export const useRiskGroupsRemove = () => {
  const [removeRiskGroup, { loading }] = useMutation(DELETE_CV_RISK_GROUP, {
    refetchQueries: ['CvGetRiskGroups'],
  });

  return { removeRiskGroup, loading };
};


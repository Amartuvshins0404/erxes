import { useMutation } from '@apollo/client';
import { CREATE_CV_RISK_GROUP } from '../graphql/cvRiskGroupsMutation';

export const useRiskGroupsCreate = () => {
  const [createRiskGroup, { loading }] = useMutation(CREATE_CV_RISK_GROUP, {
    refetchQueries: ['CvGetRiskGroups'],
  });

  return { createRiskGroup, loading };
};


import { useMutation } from '@apollo/client';
import { UPDATE_CV_RISK_GROUP } from '../graphql/cvRiskGroupsMutation';
import { GET_CV_RISK_GROUP_DETAIL } from '../graphql/cvRiskGroupsQueries';
import { toast } from 'erxes-ui';

export const useRiskGroupsUpdate = ({ id }: { id: string }) => {
  const [updateRiskGroup, { loading }] = useMutation(UPDATE_CV_RISK_GROUP, {
    refetchQueries: [
      'CvGetRiskGroups',
      { query: GET_CV_RISK_GROUP_DETAIL, variables: { id } },
    ],
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Risk group updated successfully',
        variant: 'success',
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

  return { updateRiskGroup, loading };
};


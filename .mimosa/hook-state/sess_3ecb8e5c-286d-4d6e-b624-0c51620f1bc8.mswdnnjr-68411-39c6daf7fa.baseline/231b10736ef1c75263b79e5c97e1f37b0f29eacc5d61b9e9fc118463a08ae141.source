import { useMutation } from '@apollo/client';
import { BTK_PUBLISH_NEWS } from '../graphql/newsMutations';

export const usePublishNews = () => {
  const [publishNews, { loading }] = useMutation(BTK_PUBLISH_NEWS, {
    refetchQueries: ['BtkGetNews'],
  });

  return {
    publishNews: publishNews,
    loading,
  };
};

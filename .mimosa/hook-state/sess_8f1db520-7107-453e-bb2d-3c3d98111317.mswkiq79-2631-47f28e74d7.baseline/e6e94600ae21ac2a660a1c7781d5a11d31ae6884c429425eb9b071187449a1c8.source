import { useQuery } from '@apollo/client';
import { BTK_GET_NEWS_LIST, BTK_GET_NEWS } from '../graphql/newsQueries';
import { INews } from '../types/newsTypes';

export const useNews = (list = false) => {
  const { data, loading } = useQuery<{ btkGetAllNews: INews[] }>(
    list ? BTK_GET_NEWS_LIST : BTK_GET_NEWS,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  return { news: data?.btkGetAllNews, loading };
};

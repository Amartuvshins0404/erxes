import { useQuery } from '@apollo/client';
import {
  BTK_GET_NEWS_DETAIL,
  BTK_GET_NEWS_MEMBERS,
  BTK_GET_COMPANY,
} from '../graphql/newsQueries';
import { INewsDetail, INewsMember, ICompany } from '../types/newsTypes';
import { useParams } from 'react-router-dom';
export const useNewsDetail = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{ btkGetNews: INewsDetail }>(
    BTK_GET_NEWS_DETAIL,
    { variables: { id } },
  );
  return { news: data?.btkGetNews, loading };
};

export const useCompany = () => {
  const { data, loading } = useQuery<{
    getCompanyCompanies: ICompany[];
  }>(BTK_GET_COMPANY);

  return {
    companies: data?.getCompanyCompanies || [],
    loading,
  };
};

export const useNewsMembers = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{
    btkGetNewsMembers: INewsMember[];
  }>(BTK_GET_NEWS_MEMBERS, { variables: { news: id } });
  return { projectMembers: data?.btkGetNewsMembers, loading };
};

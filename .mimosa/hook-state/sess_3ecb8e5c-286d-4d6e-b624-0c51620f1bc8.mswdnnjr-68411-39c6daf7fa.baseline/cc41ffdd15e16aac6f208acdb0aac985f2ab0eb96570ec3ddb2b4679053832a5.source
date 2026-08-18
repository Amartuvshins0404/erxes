import { useQuery } from '@apollo/client';
import {
  BTK_GET_NEWS_DETAIL,
  BTK_GET_NEWS_MEMBERS,
} from '../graphql/newsQueries';
import { INewsDetail, INewsMember, ICompany } from '../types/newsTypes';
import { useParams } from 'react-router-dom';
import { BTK_GET_COMPANIES } from '~/modules/btk/graphql/btkQueries';

export const useNewsDetail = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{ btkAdminGetNews: INewsDetail }>(
    BTK_GET_NEWS_DETAIL,
    { variables: { id } },
  );
  return { news: data?.btkAdminGetNews, loading };
};

export const useCompany = () => {
  const { data, loading } = useQuery<{ btkAdminCompanies: ICompany[] }>(
    BTK_GET_COMPANIES,
  );
  return { companies: data?.btkAdminCompanies || [], loading };
};

export const useNewsMembers = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{
    btkGetNewsMembers: INewsMember[];
  }>(BTK_GET_NEWS_MEMBERS, { variables: { news: id } });
  return { projectMembers: data?.btkGetNewsMembers, loading };
};

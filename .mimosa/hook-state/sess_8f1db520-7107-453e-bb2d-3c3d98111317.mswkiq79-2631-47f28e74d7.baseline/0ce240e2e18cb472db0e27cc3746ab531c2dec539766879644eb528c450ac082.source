import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import {
  BLOCK_GET_PROJECT_DETAIL,
  BLOCK_GET_PROJECT_MEMBERS,
} from '../graphql/projectQueries';
import { IProject, IProjectMember } from '../types/projectTypes';

export const useProjectDetail = () => {
  const { id } = useParams();

  const { data, loading } = useQuery<{ blockAdminGetProject: IProject }>(
    BLOCK_GET_PROJECT_DETAIL,
    { variables: { id } },
  );

  return { project: data?.blockAdminGetProject, loading };
};

export const useProjectMembers = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{
    blockAdminGetProjectMembers: IProjectMember[];
  }>(BLOCK_GET_PROJECT_MEMBERS, { variables: { project: id } });
  return { projectMembers: data?.blockAdminGetProjectMembers, loading };
};

import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import {
  BLOCK_GET_PROJECT_DETAIL,
  BLOCK_GET_PROJECT_MEMBERS,
} from '../graphql/projectQueries';
import { IProject, IProjectMember } from '../types/projectTypes';

export const useProjectDetail = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{ blockGetProject: IProject }>(
    BLOCK_GET_PROJECT_DETAIL,
    { variables: { id } },
  );
  return { project: data?.blockGetProject, loading };
};

export const useProjectMembers = () => {
  const { id } = useParams();
  const { data, loading } = useQuery<{
    blockGetProjectMembers: IProjectMember[];
  }>(BLOCK_GET_PROJECT_MEMBERS, { variables: { project: id } });
  return { projectMembers: data?.blockGetProjectMembers, loading };
};

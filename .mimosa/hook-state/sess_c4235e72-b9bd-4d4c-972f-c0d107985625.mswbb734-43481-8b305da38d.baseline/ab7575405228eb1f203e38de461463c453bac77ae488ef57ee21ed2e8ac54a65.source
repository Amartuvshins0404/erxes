import { useQuery } from '@apollo/client';
import { parseDateRangeFromString, useMultiQueryState } from 'erxes-ui';
import {
  BLOCK_GET_PROJECT_LIST,
  BLOCK_GET_PROJECTS,
} from '../graphql/projectQueries';
import { IProject } from '../types/projectTypes';

const useProjectVariables = () => {
  const [
    {
      searchValue,
      created,
      types,
      status,
      isPublished,
      startDate,
      endDate,
      city,
      district,
    },
  ] = useMultiQueryState<{
    searchValue: string;
    created: string;
    types: string[];
    status: string;
    city: string;
    district: string;
    isPublished: boolean;
    startDate: string;
    endDate: string;
  }>([
    'searchValue',
    'created',
    'types',
    'status',
    'city',
    'district',
    'isPublished',
    'startDate',
    'endDate',
  ]);

  const locations: Record<string, string> = {};
  const dateFilters: Record<string, any> = {};

  if (created) {
    dateFilters.createdAt = {
      gte: parseDateRangeFromString(created)?.from,
      lte: parseDateRangeFromString(created)?.to,
    };
  }

  if (startDate) {
    dateFilters.startDate = {
      gte: parseDateRangeFromString(startDate)?.from,
      lte: parseDateRangeFromString(startDate)?.to,
    };
  }

  if (endDate) {
    dateFilters.endDate = {
      gte: parseDateRangeFromString(endDate)?.from,
      lte: parseDateRangeFromString(endDate)?.to,
    };
  }

  if (city) {
    locations.city = city;
  }

  if (district) {
    locations.district = district;
  }

  return {
    filters: {
      searchValue,
      dateFilters: JSON.stringify(dateFilters),
      types,
      status,
      isPublished,
      locations: JSON.stringify(locations),
    },
  };
};

export const useProjects = (list = false) => {
  const variables = useProjectVariables();

  const { data, loading } = useQuery<{ blockGetProjects: IProject[] }>(
    list ? BLOCK_GET_PROJECT_LIST : BLOCK_GET_PROJECTS,
    {
      variables,
      fetchPolicy: 'cache-and-network',
    },
  );

  return { projects: data?.blockGetProjects, loading };
};

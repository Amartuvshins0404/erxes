import { QUERY_TEMPLATES } from '@/templates/graphql/queries';
import { Template } from '@/templates/types/Template';
import {
  parseDateRangeFromString,
  useCursorListQuery,
  useMultiQueryState,
} from 'erxes-ui';

export const useTemplatesVariables = () => {
  const [
    {
      searchValue,
      contentType,
      categoryIds,
      createdAt,
      createdBy,
      updatedAt,
      updatedBy,
    },
  ] = useMultiQueryState<{
    contentType: string;
    searchValue: string;
    createdAt: string;
    createdBy: string;
    categoryIds: string[];
    updatedAt: string;
    updatedBy: string;
  }>([
    'contentType',
    'searchValue',
    'createdAt',
    'createdBy',
    'categoryIds',
    'updatedAt',
    'updatedBy',
  ]);

  const variables: Record<string, string | string[]> = {};
  const dateFilters: Record<string, { gte?: Date; lte?: Date }> = {};

  if (contentType) {
    variables['contentType'] = contentType;
  }

  if (searchValue) {
    variables['searchValue'] = searchValue;
  }

  if (categoryIds?.length) {
    variables['categoryIds'] = categoryIds;
  }

  if (createdBy) {
    variables['createdBy'] = createdBy;
  }

  if (updatedBy) {
    variables['updatedBy'] = updatedBy;
  }

  if (createdAt) {
    dateFilters.createdAt = {
      gte: parseDateRangeFromString(createdAt)?.from,
      lte: parseDateRangeFromString(createdAt)?.to,
    };
  }

  if (updatedAt) {
    dateFilters.updatedAt = {
      gte: parseDateRangeFromString(updatedAt)?.from,
      lte: parseDateRangeFromString(updatedAt)?.to,
    };
  }

  if (dateFilters.createdAt || dateFilters.updatedAt) {
    variables['dateFilters'] = JSON.stringify(dateFilters);
  }

  return variables;
};

export const useTemplates = () => {
  const variables = useTemplatesVariables();

  const { list, ...rest } = useCursorListQuery<Template>(QUERY_TEMPLATES, {
    field: 'templateList',
    variables,
  });

  return { templates: list, ...rest };
};

import { OperationVariables } from '@apollo/client';
import {
  EnumCursorDirection,
  useCursorListQuery,
  useMultiQueryState,
} from 'erxes-ui';

import { QUERY_TEMPLATE_CATEGORIES } from '../graphql/queries';
import { TemplateCategory } from '../types';

export const useTemplateCategoryVariables = () => {
  const [{ contentType }] = useMultiQueryState<{
    contentType: string;
  }>(['contentType']);

  return {
    type: contentType || undefined,
  };
};

export const useTemplateCategories = (options: {
  variables?: OperationVariables;
  skip?: boolean;
}) => {
  const variables = useTemplateCategoryVariables();

  const { list, handleFetchMore, ...rest } =
    useCursorListQuery<TemplateCategory>(QUERY_TEMPLATE_CATEGORIES, {
      field: 'templateCategories',
      skip: options.skip,
      variables: { ...variables, ...options.variables },
    });

  return {
    categories: list,
    ...rest,
    handleFetchMore: (params?: { direction: EnumCursorDirection }) =>
      handleFetchMore({
        direction: params?.direction ?? EnumCursorDirection.FORWARD,
      }),
  };
};

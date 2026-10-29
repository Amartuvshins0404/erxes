import { EMAIL_TEMPLATES } from '@/emailTemplates/graphql/queries';
import { IEmailTemplate } from '@/emailTemplates/types';
import { useCursorListQuery, useMultiQueryState } from 'erxes-ui';

type TEmailTemplatesSearch = { searchValue?: string };

export const useEmailTemplatesVariables = (
  override?: TEmailTemplatesSearch,
) => {
  const [{ searchValue }] = useMultiQueryState<{ searchValue: string }>([
    'searchValue',
  ]);

  return {
    searchValue: (override ? override.searchValue : searchValue) || undefined,
    orderBy: { createdAt: -1 },
  };
};

export const useEmailTemplates = (override?: TEmailTemplatesSearch) => {
  const variables = useEmailTemplatesVariables(override);

  const { list, ...rest } = useCursorListQuery<IEmailTemplate>(
    EMAIL_TEMPLATES,
    { field: 'emailTemplates', variables },
  );

  return { emailTemplates: list, ...rest };
};

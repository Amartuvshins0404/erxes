import type { ApolloError } from '@apollo/client';
import { EnumCursorDirection, toast, useCursorListQuery } from 'erxes-ui';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useDebounce } from 'use-debounce';
import { EMAIL_TEMPLATE_PICKER_QUERY } from '../graphql/queries';
import { emailTemplateFormat } from '../types';
import type { EmailTemplate, EmailTemplateContentFormat } from '../types';

export interface EmailTemplatePickerOptions {
  disabled?: boolean;
  format?: EmailTemplateContentFormat;
  onSelect: (template: EmailTemplate) => Promise<void> | void;
}

interface EmailTemplatePickerState {
  disabled: boolean;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  applyingId?: string;
  applying: boolean;
  templates: EmailTemplate[];
  hasNextPage: boolean;
  loading: boolean;
  error?: ApolloError;
  refetch: () => void;
  select: (template: EmailTemplate) => Promise<void>;
  loadMore: () => void;
}

export const useEmailTemplatePicker = ({
  disabled = false,
  format,
  onSelect,
}: EmailTemplatePickerOptions): EmailTemplatePickerState => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchValue] = useDebounce(search, 250);
  const [applyingId, setApplyingId] = useState<string>();
  const applying = Boolean(applyingId);
  const { list, hasNextPage, loading, error, refetch, handleFetchMore } =
    useCursorListQuery<EmailTemplate>(EMAIL_TEMPLATE_PICKER_QUERY, {
      field: 'emailTemplates',
      variables: { searchValue: searchValue || undefined },
      skip: !open,
      notifyOnNetworkStatusChange: true,
    });

  const select = async (template: EmailTemplate) => {
    if (disabled || applying) return;
    setApplyingId(template._id);
    try {
      await onSelect(template);
      setOpen(false);
    } catch (cause) {
      toast({
        title: 'Unable to select email template',
        description: cause instanceof Error ? cause.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setApplyingId(undefined);
    }
  };

  return {
    disabled,
    open,
    setOpen,
    search,
    setSearch,
    applyingId,
    applying,
    templates: list.filter(
      (template) => !format || emailTemplateFormat(template) === format,
    ),
    hasNextPage: Boolean(hasNextPage),
    loading,
    error,
    refetch: () => void refetch().catch(() => undefined),
    select,
    loadMore: () => handleFetchMore({ direction: EnumCursorDirection.FORWARD }),
  };
};

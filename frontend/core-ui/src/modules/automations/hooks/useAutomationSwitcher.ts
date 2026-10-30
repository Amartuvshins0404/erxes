import { AUTOMATIONS_SWITCHER_LIST } from '@/automations/graphql/automationQueries';
import { IAutomation } from '@/automations/types';
import { EnumCursorDirection, useCursorListQuery } from 'erxes-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from 'use-debounce';

type TAutomationSwitcherItem = Pick<IAutomation, '_id' | 'name' | 'status'>;

const SWITCHER_PAGE_SIZE = 20;

export const useAutomationSwitcher = (currentId?: string) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  const { list, totalCount, loading, error, handleFetchMore } =
    useCursorListQuery<TAutomationSwitcherItem>(AUTOMATIONS_SWITCHER_LIST, {
      field: 'automationsMain',
      variables: { searchValue: debouncedSearch },
      limit: SWITCHER_PAGE_SIZE,
      skip: !open,
    });

  const handleSelect = (automationId: string) => {
    setOpen(false);
    if (automationId !== currentId) {
      navigate(`/automations/edit/${automationId}`);
    }
  };

  return {
    open,
    setOpen,
    search,
    setSearch,
    automations: list,
    loading,
    error,
    totalCount,
    handleFetchMore: () =>
      handleFetchMore({ direction: EnumCursorDirection.FORWARD }),
    handleSelect,
  };
};

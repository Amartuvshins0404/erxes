import { useContext } from 'react';
import { SelectUnitStatusesContext } from '../context/select-unit-statuses';

export const useSelectUnitStatusesContext = () => {
  const context = useContext(SelectUnitStatusesContext);

  if (!context) {
    throw new Error(
      'useSelectUnitStatuses must be used within a SelectUnitStatusesProvider',
    );
  }

  return context;
};

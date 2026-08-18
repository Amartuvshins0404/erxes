import { SelectOneFitCustomerContext } from '../contexts/SelectOneFitCustomerContext';
import { useContext } from 'react';

export const useSelectOneFitCustomerContext = () => {
  const context = useContext(SelectOneFitCustomerContext);
  if (!context) {
    throw new Error(
      'useSelectOneFitCustomerContext must be used within a SelectOneFitCustomerProvider',
    );
  }
  return context;
};

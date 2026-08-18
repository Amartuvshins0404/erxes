import { createContext, useContext } from 'react';
import { OneFitCustomer } from '../types/onefitCustomer';

export interface IOneFitCustomersInlineContext {
  customers?: OneFitCustomer[];
  loading: boolean;
  customerIds?: string[];
  placeholder: string;
  updateCustomers?: (customers: OneFitCustomer[]) => void;
  getCustomerTitle: (customer?: OneFitCustomer) => string;
}

export const OneFitCustomersInlineContext =
  createContext<IOneFitCustomersInlineContext | null>(null);

export const useOneFitCustomersInlineContext = () => {
  const context = useContext(OneFitCustomersInlineContext);
  if (!context) {
    throw new Error(
      'useOneFitCustomersInlineContext must be used within a OneFitCustomersInlineProvider',
    );
  }
  return context;
};

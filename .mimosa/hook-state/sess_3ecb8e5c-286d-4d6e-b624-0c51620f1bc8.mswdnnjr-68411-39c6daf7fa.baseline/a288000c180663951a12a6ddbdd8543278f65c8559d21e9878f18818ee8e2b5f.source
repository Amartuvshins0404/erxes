import { createContext } from 'react';
import { OneFitCustomer } from '../types/onefitCustomer';

export type ISelectOneFitCustomerContext = {
  customerIds: string[];
  onSelect: (customer: OneFitCustomer) => void;
  customers: OneFitCustomer[];
  setCustomers: (customers: OneFitCustomer[]) => void;
  loading: boolean;
  error: string | null;
  type?: 'onefit' | 'erxes';
};

export const SelectOneFitCustomerContext =
  createContext<ISelectOneFitCustomerContext | null>(null);

import { createContext, useContext } from 'react';
import { TSelectUnitStatusesContext } from '../types/unit-contexts';

export const SelectUnitStatusesContext = createContext<
  TSelectUnitStatusesContext | undefined
>(undefined);

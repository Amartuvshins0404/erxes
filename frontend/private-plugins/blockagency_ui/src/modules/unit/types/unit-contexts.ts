import React from 'react';

export type TSelectUnitStatusesContext = {
  value: string | string[] | undefined;
  selectedValues: string[];
  onValueChange?: (value: string | string[] | undefined) => void;
  mode?: 'single' | 'multiple';
};

export type TSelectUnitStatusesProvider = React.PropsWithChildren<{
  value: string | string[] | undefined;
  onValueChange?: (value: string | string[] | undefined) => void;
  mode?: 'single' | 'multiple';
}>;

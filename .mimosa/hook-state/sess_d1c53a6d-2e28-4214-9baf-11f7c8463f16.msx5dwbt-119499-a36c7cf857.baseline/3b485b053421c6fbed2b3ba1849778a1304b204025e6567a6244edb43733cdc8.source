import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export interface UnitsState {
  selected: Record<string, boolean>;
  toggleOne: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const UnitsContext = createContext<UnitsState | null>(null);

export const UnitsProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const toggleAll = (ids: string[], checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const id of ids) next[id] = checked;
    setSelected(next);
  };

  const value = useMemo(
    () => ({ selected, toggleOne, toggleAll, setSelected }),
    [selected],
  );

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
};

export const useUnitsContext = () => {
  const ctx = useContext(UnitsContext);

  if (!ctx) throw new Error('useUnitsContext must be used inside provider');

  return ctx;
};

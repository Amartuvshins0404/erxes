import { atom } from 'jotai';
import { contractCountByBoardAtom } from './contractCountByBoardAtom';

export const contractTotalCountAtom = atom<number | null>(null);

export const contractTotalCountBoardAtom = atom((get) =>
  Object.values(get(contractCountByBoardAtom)).reduce(
    (acc, curr) => acc + curr,
    0,
  ),
);

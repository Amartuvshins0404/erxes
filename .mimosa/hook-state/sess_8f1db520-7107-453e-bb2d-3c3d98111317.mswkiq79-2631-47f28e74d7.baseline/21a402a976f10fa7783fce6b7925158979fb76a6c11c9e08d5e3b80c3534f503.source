import { atom } from 'jotai';
import { opptyCountByProjectAtom } from './opptyCountByProjectAtom';

export const opptyTotalCountAtom = atom<number | null>(null);

export const opptyTotalCountBoardAtom = atom((get) =>
  Object.values(get(opptyCountByProjectAtom)).reduce(
    (acc, curr) => acc + curr,
    0,
  ),
);

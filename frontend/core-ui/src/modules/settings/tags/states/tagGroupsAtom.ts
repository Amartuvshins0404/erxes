import { atomFamily } from 'jotai/utils';
import { atom } from 'jotai';
import { ITag } from 'ui-modules';

export const tagGroupsAtomFamily = atomFamily((type: string | null) =>
  atom<ITag[]>([]),
);

import { atomFamily } from 'jotai/utils';
import { atom } from 'jotai';
import { ITag } from 'ui-modules';

export const childTagsMapAtomFamily = atomFamily((type: string | null) =>
  atom<Record<string, ITag[]>>({}),
);

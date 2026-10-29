import { atom } from 'jotai';
import { ITag } from 'ui-modules';

export const addingTagAtom = atom<Partial<ITag> | null>(null);

import { atomWithStorage } from 'jotai/utils';
import { TViewMode } from './types/agencyTypes';

export const adminAgencyViewModeAtom = atomWithStorage<TViewMode>(
  'agency-view-mode-preference',
  'grid',
);

export const adminListingViewModeAtom = atomWithStorage<TViewMode>(
  'listing-view-mode-preference',
  'grid',
);

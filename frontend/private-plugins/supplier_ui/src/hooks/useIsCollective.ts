import { useAtomValue } from 'jotai';
import { currentOrganizationState } from 'ui-modules';

export const useIsCollective = (): boolean => {
  const org = useAtomValue(currentOrganizationState) as
    | (Record<string, unknown> & { bundle?: { type?: string } })
    | null;

  return org?.bundle?.type === 'mushop-coshop';
};

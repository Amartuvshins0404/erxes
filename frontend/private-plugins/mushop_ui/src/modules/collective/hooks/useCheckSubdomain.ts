import { useQuery } from '@apollo/client';
import { useDebounce } from 'use-debounce';
import { MUSHOP_CHECK_SUBDOMAIN } from '../graphql/queries';
import { isValidSubdomain } from '../utils/subdomain';

export interface ISubdomainCheck {
  status?: string;
  suggestion?: string;
}

const normalize = (raw: any): ISubdomainCheck | null => {
  if (raw == null) return null;
  if (typeof raw === 'string') return { status: raw };
  return { status: raw.status, suggestion: raw.suggestion };
};

export const useCheckSubdomain = (subdomain: string) => {
  const [debounced] = useDebounce(subdomain.trim(), 500);
  const skip = !isValidSubdomain(debounced);

  const { data, loading } = useQuery<{ mushopCheckSubdomain: any }>(
    MUSHOP_CHECK_SUBDOMAIN,
    {
      variables: { subdomain: debounced },
      skip,
      fetchPolicy: 'network-only',
    },
  );

  const result = normalize(data?.mushopCheckSubdomain);
  const available = result?.status
    ? result.status.toLowerCase() === 'available'
    : undefined;

  return {
    result,
    available,
    // checking only while the debounced value is the current trimmed input
    loading: !skip && (loading || debounced !== subdomain.trim()),
  };
};

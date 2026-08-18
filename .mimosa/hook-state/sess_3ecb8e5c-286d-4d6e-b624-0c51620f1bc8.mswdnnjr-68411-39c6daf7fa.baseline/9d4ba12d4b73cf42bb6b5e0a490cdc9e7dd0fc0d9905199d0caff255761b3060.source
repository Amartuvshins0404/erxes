import { MAIN_CURRENCY } from '@/pricing/graphql/paymentPlanQueries';
import { useQuery } from '@apollo/client';

export const useCurrency = () => {
  const { data } = useQuery(MAIN_CURRENCY, {
    variables: { code: 'mainCurrency' },
  });

  const config = data?.configsGetValue || {};

  return { mainCurrency: config.value };
};

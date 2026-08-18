import { useNewsDetail } from '~/modules/news/hooks/useNewsDetail';
import { Spinner } from 'erxes-ui';
import { Suspense, lazy } from 'react';

const NewsDetailMedia = lazy(() =>
  import('./NewsDetailMedia').then((module) => ({
    default: module.NewsDetailMedia,
  })),
);

export const NewsDetailTabs = () => {
  const { loading } = useNewsDetail();

  if (loading) return null;

  return (
    <Suspense fallback={<Spinner containerClassName="py-32" />}>
      {<NewsDetailMedia />}
    </Suspense>
  );
};

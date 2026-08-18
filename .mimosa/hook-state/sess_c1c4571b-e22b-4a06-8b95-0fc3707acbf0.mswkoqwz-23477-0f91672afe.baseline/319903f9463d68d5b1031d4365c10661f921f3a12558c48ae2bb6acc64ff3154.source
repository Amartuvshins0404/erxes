import { NewsCard } from './NewsCard';
import { useNews } from '../hooks/useNews';
import { Spinner } from 'erxes-ui';

export const News = () => {
  const { news, loading } = useNews();

  if (loading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  return (
    <div className="grid grid-cols-1 blk:lg:grid-cols-2 blk:xl:grid-cols-3 gap-6 p-8">
      {news?.map((news) => (
        <NewsCard key={news._id} {...news} />
      ))}
    </div>
  );
};

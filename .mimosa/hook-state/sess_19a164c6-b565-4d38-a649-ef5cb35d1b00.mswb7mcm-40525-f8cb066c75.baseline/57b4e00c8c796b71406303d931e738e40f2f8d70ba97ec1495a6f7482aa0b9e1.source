import { useNews } from '~/modules/news/hooks/useNews';
import { INews } from '~/modules/news/types/newsTypes';
import { IconCheck } from '@tabler/icons-react';
import {
  Button,
  cn,
  SkeletonArray,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { useEffect } from 'react';

export const NewsList = () => {
  const { news, loading } = useNews(true);
  const [projectId, setNewsId] = useQueryState<string>('projectId');

  useEffect(() => {
    if (!projectId && news && news.length > 0) {
      setNewsId(news[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, setNewsId]);

  if (loading) {
    return (
      <div className="space-y-2 ml-4">
        <SkeletonArray className="w-32 h-4" count={4} />
      </div>
    );
  }

  return news?.map((news) => <NewsItem key={news._id} {...news} />);
};

export const NewsItem = ({ _id, name }: INews) => {
  const [{ projectId }, setQueries] = useMultiQueryState<{
    projectId: string;
    buildingId: string;
  }>(['projectId', 'buildingId']);
  const isActive = projectId === _id;

  const handleClick = () =>
    setQueries({
      projectId: _id === projectId ? null : _id,
      buildingId: null,
    });

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'justify-start pl-7 relative overflow-hidden text-left flex-auto ml-1',
        isActive && 'bg-primary/10 hover:bg-primary/10',
      )}
      onClick={handleClick}
    >
      {isActive && <IconCheck className="absolute left-1.5" />}
      {name}
    </Button>
  );
};

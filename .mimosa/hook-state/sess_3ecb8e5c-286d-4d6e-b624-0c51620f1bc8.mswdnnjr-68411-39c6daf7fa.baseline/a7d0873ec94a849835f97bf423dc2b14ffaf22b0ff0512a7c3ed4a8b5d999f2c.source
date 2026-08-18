import {
  Breadcrumb,
  Input,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  Select,
  Skeleton,
  Tooltip,
} from 'erxes-ui';
import { useUpdateNewsGeneralInfo } from '../hooks/useUpdateNews';
import { useEffect, useState } from 'react';
import { useNews } from '~/modules/news/hooks/useNews';
import { useNavigate, useParams } from 'react-router-dom';

export const NewsDetailNameBreadcrumb = () => {
  const { news, loading: projectsLoading } = useNews(true);
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  if (projectsLoading) return <Skeleton className="w-32 h-4" />;

  if (!news) return null;

  return (
    <>
      <Breadcrumb.Separator />
      <Breadcrumb.Page className="font-medium px-3">
        <Select
          value={projectId}
          onValueChange={(value) => {
            navigate(`/btk/news/${value}`);
          }}
        >
          <Select.Trigger className="min-w-32 bg-background">
            <Select.Value placeholder="Select news" />
          </Select.Trigger>
          <Select.Content>
            {news?.map((news) => (
              <Select.Item key={news._id} value={news._id}>
                {news.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </Breadcrumb.Page>
    </>
  );
};

export const NewsDetailName = ({ name, id }: { name: string; id: string }) => {
  const [nameValue, setNameValue] = useState(name);
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();

  useEffect(() => {
    if (name) {
      setNameValue(name);
    }
  }, [name]);

  return (
    <PopoverScoped
      closeOnEnter
      onOpenChange={(open) => {
        if (!open && nameValue !== name) {
          updateNewsGeneralInfo(id || '', { name: nameValue || '' });
        }
      }}
    >
      <Tooltip.Provider delayDuration={0}>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <h1 className="text-xl font-medium leading-none hover:bg-accent">
                {name}
              </h1>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Edit news name</p>
          </Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
      <RecordTableInlineCell.Content sideOffset={-24}>
        <Input
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

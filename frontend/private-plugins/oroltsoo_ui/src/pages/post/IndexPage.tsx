import { IconSearch, IconWriting } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Input,
  PageContainer,
  PageSubHeader,
  ScrollArea,
  Select,
  Separator,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { PostFormSheet } from '@/post/components/PostFormSheet';
import { PostList } from '@/post/components/PostList';
import { POST_STATUS_OPTIONS } from '@/post/constants/postConstants';
import { IPost } from '@/post/types/post';

const ALL_STATUSES = 'all';

export const IndexPage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<IPost | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const openEdit = (post: IPost) => {
    setEditing(post);
    setIsOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/oroltsoo/posts">
                    <IconWriting />
                    Постууд
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Постууд']}
            icon="IconWriting"
          />
        </PageHeader.Start>
      </PageHeader>

      <PageSubHeader className="items-center">
        <div className="relative w-full max-w-72">
          <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={searchValue}
            placeholder="Гарчиг, тайлбар, шошгоор хайх"
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <Select
          value={status || ALL_STATUSES}
          onValueChange={(value) =>
            setStatus(value === ALL_STATUSES ? '' : value)
          }
        >
          <Select.Trigger className="w-44">
            <Select.Value placeholder="Бүх төлөв" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL_STATUSES}>Бүх төлөв</Select.Item>
            {POST_STATUS_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>

        <Button className="ml-auto" onClick={openAdd}>
          <IconWriting />
          Пост нэмэх
        </Button>
      </PageSubHeader>

      <ScrollArea className="flex-auto bg-sidebar">
        <PostList
          searchValue={searchValue}
          status={status}
          onAdd={openAdd}
          onEdit={openEdit}
        />
        <ScrollArea.Bar orientation="horizontal" />
      </ScrollArea>

      <PostFormSheet open={isOpen} onOpenChange={setIsOpen} post={editing} />
    </PageContainer>
  );
};

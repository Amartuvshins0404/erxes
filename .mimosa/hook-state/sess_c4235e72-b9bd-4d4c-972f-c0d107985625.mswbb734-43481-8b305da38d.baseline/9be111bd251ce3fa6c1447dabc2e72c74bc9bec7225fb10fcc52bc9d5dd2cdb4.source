import { PageContainer, Separator, ScrollArea } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { News } from '~/modules/news/components/News';
import { NewsBreadcrumb } from '~/modules/news/components/NewsBreadcrumb';

export const NewsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <NewsBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <ScrollArea className="flex-auto">
        <News />
      </ScrollArea>
    </PageContainer>
  );
};

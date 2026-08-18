import { ScrollArea, Button } from 'erxes-ui';
import { useState } from 'react';
import { NewsBreadcrumb } from '~/modules/news/components/NewsBreadcrumb';
import { PageContainer } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { NewsDetailNameBreadcrumb } from '~/modules/news/components/NewsDetailName';
import { NewsDetailTabs } from '~/modules/news/components/NewsDetailTabs';
import { NewsDetailProfile } from '~/modules/news/components/NewsDetailProfile';
import { NewsDetailPreview } from '~/modules/news/components/NewsDetailPreview';
import { IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand } from '@tabler/icons-react';

export const NewsDetail = () => {
  const [previewOpen, setPreviewOpen] = useState(true);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <NewsBreadcrumb>
            <NewsDetailNameBreadcrumb />
          </NewsBreadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            {previewOpen ? (
              <IconLayoutSidebarRightCollapse className="size-4" />
            ) : (
              <IconLayoutSidebarRightExpand className="size-4" />
            )}
            Preview
          </Button>
        </PageHeader.End>
      </PageHeader>
      <div className="flex flex-auto overflow-hidden">
        <div className="flex flex-col flex-auto overflow-hidden">
          <NewsDetailProfile />
          <ScrollArea className="flex-auto bg-sidebar">
            <NewsDetailTabs />
            <ScrollArea.Bar orientation="horizontal" />
          </ScrollArea>
        </div>
        {previewOpen && <NewsDetailPreview />}
      </div>
    </PageContainer>
  );
};

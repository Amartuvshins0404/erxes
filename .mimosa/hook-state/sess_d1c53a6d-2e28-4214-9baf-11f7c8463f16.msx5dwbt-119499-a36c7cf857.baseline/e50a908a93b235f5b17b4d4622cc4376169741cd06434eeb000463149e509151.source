import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { ProjectBreadcrumb } from '@/project/components/ProjectBreadcrumb';
import { Projects } from '@/project/components/Projects';
import { PageHeader } from 'ui-modules';
import { ProjectsFilter } from '@/project/components/ProjectsFilter';

export const ProjectsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <ProjectBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <PageSubHeader>
        <ProjectsFilter />
      </PageSubHeader>
      <ScrollArea className="flex-auto">
        <Projects />
      </ScrollArea>
    </PageContainer>
  );
};

import { CreateProject } from '@/project/components/CreateProject';
import { ProjectBreadcrumb } from '@/project/components/ProjectBreadcrumb';
import { Projects } from '@/project/components/Projects';
import { ProjectsFilter } from '@/project/components/ProjectsFilter';
import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

export const ProjectsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <ProjectBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <CreateProject />
        </PageHeader.End>
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

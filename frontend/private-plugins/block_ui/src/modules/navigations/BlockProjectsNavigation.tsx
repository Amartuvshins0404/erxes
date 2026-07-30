import {
  Button,
  Collapsible,
  NavigationMenuGroup,
  NavigationMenuLinkItem,
  Sidebar,
  Skeleton,
  TextOverflowTooltip,
} from 'erxes-ui';
import {
  IconCaretRightFilled,
  IconStackFilled,
  IconClipboardTextFilled,
  IconContract,
  IconListCheck,
  IconFileInvoice,
  IconFileText,
  IconChartBar,
} from '@tabler/icons-react';

import { useProjects } from '@/project/hooks/useProjects';
import { IProject } from '@/project/types/projectTypes';

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-4" />
      ))}
    </div>
  );
}

interface ProjectItemProps {
  project: IProject;
}

function ProjectItem({ project }: ProjectItemProps) {
  return (
    <Collapsible className="group/collapsible">
      <Sidebar.Group className="p-0">
        <div className="w-full relative group/trigger hover:cursor-pointer">
          <Collapsible.Trigger asChild>
            <div className="w-full flex items-center justify-between">
              <Button
                variant="ghost"
                className="px-2 flex min-w-0 justify-start"
              >
                <IconClipboardTextFilled className="text-accent-foreground shrink-0" />
                <TextOverflowTooltip
                  className="font-sans font-semibold normal-case flex-1 min-w-0"
                  value={project.name}
                />
                <span className="ml-auto shrink-0">
                  <IconCaretRightFilled className="size-3 transition-transform group-data-[state=open]/collapsible:rotate-90 text-accent-foreground" />
                </span>
              </Button>
              <div className="size-5 min-w-5 mr-2"></div>
            </div>
          </Collapsible.Trigger>
        </div>
        <Collapsible.Content className="pt-1">
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Overview"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconChartBar}
                path={`${project._id}/overview`}
              />
            </Sidebar.Menu>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Stacking View"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconStackFilled}
                path={`${project._id}/stacking-plan`}
              />
            </Sidebar.Menu>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Opportunities"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconListCheck}
                path={`${project._id}/opportunities`}
              />
            </Sidebar.Menu>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Offers"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconFileText}
                path={`${project._id}/offers`}
              />
            </Sidebar.Menu>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Contracts"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconContract}
                path={`${project._id}/contracts`}
              />
            </Sidebar.Menu>
            <Sidebar.Menu>
              <NavigationMenuLinkItem
                name="Finance"
                className="pl-6 font-medium"
                pathPrefix="block/project"
                icon={IconFileInvoice}
                path={`${project._id}/payments`}
              />
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Collapsible.Content>
      </Sidebar.Group>
    </Collapsible>
  );
}

export const BlockProjectsNavigation = () => {
  const { projects, loading } = useProjects();

  return (
    <NavigationMenuGroup name="Stacking Plan">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        projects?.map((project) => (
          <ProjectItem key={project._id} project={project} />
        ))
      )}
    </NavigationMenuGroup>
  );
};

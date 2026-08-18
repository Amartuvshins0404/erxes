import {
  // Button,
  NavigationMenuGroup,
  PageContainer,
  // PageSubHeader,
  Sidebar,
} from 'erxes-ui';
import { StackingHeader } from './StackingHeader';

// import { IconFilter2 } from '@tabler/icons-react';
import { BuildingList } from '@/building/components/BuildingList';

export const StackingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PageContainer>
      <StackingHeader />
      <div className="flex flex-auto overflow-hidden">
        <StackingSidebar />
        <div className="flex flex-auto overflow-hidden flex-col">
          {/* <PageSubHeader>
            <Button variant="ghost">
              <IconFilter2 />
              Filter
            </Button>
          </PageSubHeader> */}
          {children}
        </div>
      </div>
    </PageContainer>
  );
};

export const StackingSidebar = () => {
  return (
    <Sidebar collapsible="none" className="border-r flex-none">
      <NavigationMenuGroup name="Building">
        <BuildingList />
      </NavigationMenuGroup>
    </Sidebar>
  );
};

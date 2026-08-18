import { IconContract } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { ContractAddSheet } from './ContractAdd';
import { ContractsFilter } from './ContractsFilter';
import { ContractsViewControl } from './ContractsView';

export const ContractsLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/block/contracts">
                    <IconContract />
                    Contracts
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <ContractAddSheet />
        </PageHeader.End>
      </PageHeader>
      <div className="flex overflow-hidden w-full h-full">
        <div className="flex flex-col overflow-hidden w-full h-full">
          <PageSubHeader>
            <ContractsFilter />
            <ContractsViewControl />
          </PageSubHeader>
          {children}
        </div>
      </div>
    </>
  );
};

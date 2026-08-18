import { IconContract, IconShield } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { ContractsBoard } from '@/contracts/components/ContractsBoard';
import { ContractDetail } from '@/contracts/components/ContractDetail';

export const ContractsPage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/blocktest">
                    <IconShield />
                    Coverhill
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Page>
                <Button variant="ghost" asChild>
                  <Link to="/blocktest/contracts">
                    <IconContract />
                    Contracts
                  </Link>
                </Button>
              </Breadcrumb.Page>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <ContractsBoard />
      <ContractDetail />
    </div>
  );
};

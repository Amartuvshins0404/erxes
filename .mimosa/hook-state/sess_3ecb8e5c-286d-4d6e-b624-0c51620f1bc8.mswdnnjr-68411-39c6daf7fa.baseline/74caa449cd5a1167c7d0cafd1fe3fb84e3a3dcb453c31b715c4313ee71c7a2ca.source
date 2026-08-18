import { IconShield, IconUser } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { ClientsRecordTable } from '@/clients/components/ClientsRecordTable';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { ClientCreateSheet } from '@/clients/components/ClientCreate';
import { ClientDetailSheet } from '@/clients/components/ClientDetailSheet';
import { ClientsFilter } from '@/clients/components/ClientsFilter';

export const ClientsPage = () => {
  return (
    <>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconShield />
                  Coverhill
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Page>
                <Button variant="ghost" asChild>
                  <Link to="/blocktest/clients">
                    <IconUser />
                    Clients
                  </Link>
                </Button>
              </Breadcrumb.Page>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <ClientCreateSheet />
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <ClientsFilter />
      </PageSubHeader>
      <ClientsRecordTable />
      <ClientDetailSheet />
    </>
  );
};

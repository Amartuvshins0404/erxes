import { IconShield, IconUsersGroup } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { RiskGroupsRecordTable } from '@/risk/riskGroup/components/RiskGroupsRecordTable';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { RiskGroupCreateSheet } from '@/risk/riskGroup/components/RiskGroupCreate';
import { RiskGroupDetailSheet } from '@/risk/riskGroup/components/RiskGroupDetailSheet';
import { RiskGroupsFilter } from '@/risk/riskGroup/components/RiskGroupsFilter';

export const RiskGroupsPage = () => {
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
                  <Link to="/blocktest/risk-groups">
                    <IconUsersGroup />
                    Risk Groups
                  </Link>
                </Button>
              </Breadcrumb.Page>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <RiskGroupCreateSheet />
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <RiskGroupsFilter />
      </PageSubHeader>
      <RiskGroupsRecordTable />
      <RiskGroupDetailSheet />
    </>
  );
};


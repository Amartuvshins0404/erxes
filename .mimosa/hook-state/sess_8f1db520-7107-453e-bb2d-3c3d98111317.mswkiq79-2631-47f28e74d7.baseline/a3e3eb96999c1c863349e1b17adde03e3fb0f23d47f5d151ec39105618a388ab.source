import { IconBuilding, IconShield } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { MarketsRecordTable } from '@/markets/components/MarketsRecordTable';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { MarketCreateSheet } from '@/markets/components/MarketCreate';
import { MarketDetailSheet } from '@/markets/components/MarketDetailSheet';
import { MarketsFilter } from '@/markets/components/MarketsFilter';

export const MarketsPage = () => {
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
                  <Link to="/blocktest/markets">
                    <IconBuilding />
                    Markets
                  </Link>
                </Button>
              </Breadcrumb.Page>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <MarketCreateSheet />
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <MarketsFilter />
      </PageSubHeader>
      <MarketsRecordTable />
      <MarketDetailSheet />
    </>
  );
};

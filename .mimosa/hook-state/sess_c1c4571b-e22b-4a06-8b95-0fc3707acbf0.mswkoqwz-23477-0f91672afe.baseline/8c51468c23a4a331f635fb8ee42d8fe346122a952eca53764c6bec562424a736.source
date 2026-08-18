import { IconCreditCard } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from 'ui-modules';
import { MembersFilter } from '../components/MembersFilter';
import { MembersTable } from '../components/MembersTable';
import { MemberDetailSheet } from '../components/MemberDetailSheet';
import { GrantMembershipSheet } from '../components/GrantMembershipSheet';

export const MembersPage = () => {
  const { t } = useTranslation('blockadmin');
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/blockadmin/membership">
                    <IconCreditCard />
                    {t('Membership')}
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <GrantMembershipSheet />
        </PageHeader.End>
      </PageHeader>

      <PageSubHeader>
        <MembersFilter />
      </PageSubHeader>

      <MembersTable />

      <MemberDetailSheet />
    </PageContainer>
  );
};

export default MembersPage;

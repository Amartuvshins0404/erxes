import { IconSearch, IconUsersGroup } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Input,
  PageContainer,
  PageSubHeader,
  ScrollArea,
  Select,
  Separator,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { MeetingList } from '@/meeting/components/MeetingList';
import { MEETING_STATUS_OPTIONS } from '@/meeting/constants/meetingConstants';

const ALL_STATUSES = 'all';

export const IndexPage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState('');

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/oroltsoo/meetings">
                    <IconUsersGroup />
                    Уулзалтын хуваарь
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Уулзалтын хуваарь']}
            icon="IconUsersGroup"
          />
        </PageHeader.Start>
      </PageHeader>

      <PageSubHeader className="items-center">
        <div className="relative w-full max-w-72">
          <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={searchValue}
            placeholder="Сэдэв, байршил, тэмдэглэлээр хайх"
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <Select
          value={status || ALL_STATUSES}
          onValueChange={(value) =>
            setStatus(value === ALL_STATUSES ? '' : value)
          }
        >
          <Select.Trigger className="w-44">
            <Select.Value placeholder="Бүх төлөв" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL_STATUSES}>Бүх төлөв</Select.Item>
            {MEETING_STATUS_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </PageSubHeader>

      <ScrollArea className="flex-auto bg-sidebar">
        <MeetingList searchValue={searchValue} status={status} />
        <ScrollArea.Bar orientation="horizontal" />
      </ScrollArea>
    </PageContainer>
  );
};

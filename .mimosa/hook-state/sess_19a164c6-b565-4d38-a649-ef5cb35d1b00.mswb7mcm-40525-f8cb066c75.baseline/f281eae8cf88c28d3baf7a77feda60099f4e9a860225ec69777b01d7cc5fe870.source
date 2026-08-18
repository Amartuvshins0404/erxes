import { UseFormReturn } from 'react-hook-form';
import { Form, InfoCard, Select } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { IListing } from '../types/listing';
import { useAgencyMembers } from '../../agency/hooks/useAgencyMembers';

const GET_USERS = gql`
  query AllUsers($ids: [String]) {
    allUsers(ids: $ids) {
      _id
      email
      details {
        firstName
        lastName
      }
    }
  }
`;

type User = {
  _id: string;
  email?: string;
  details?: { firstName?: string; lastName?: string };
};

const getUserLabel = (user?: User) => {
  if (!user) return '';
  const name = [user.details?.firstName, user.details?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || user.email || '';
};

type Props = {
  form: UseFormReturn<IListing>;
};

export const ListingMemberSection: React.FC<Props> = ({ form }) => {
  const { control } = form;
  const { agencyMembers, loading: membersLoading } = useAgencyMembers();

  const memberUserIds = agencyMembers.map((m) => m.memberId);
  const { data: usersData } = useQuery(GET_USERS, {
    variables: { ids: memberUserIds },
    skip: memberUserIds.length === 0,
  });

  const users: User[] = usersData?.allUsers || [];
  const userMap = Object.fromEntries(users.map((u) => [u._id, u]));

  return (
    <InfoCard title="Assigned Agent">
      <InfoCard.Content>
        <Form.Field<IListing, 'memberId'>
          control={control}
          name="memberId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Agent</Form.Label>
              <Form.Control>
                <Select
                  value={field.value ?? 'unassigned'}
                  onValueChange={(v) =>
                    field.onChange(v === 'unassigned' ? undefined : v)
                  }
                  disabled={membersLoading}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select agent" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="unassigned">
                      <span className="text-muted-foreground">Unassigned</span>
                    </Select.Item>
                    {agencyMembers.map((m) => {
                      const user = userMap[m.memberId];
                      const label = getUserLabel(user) || m.memberId;
                      return (
                        <Select.Item key={m._id} value={m._id}>
                          {label}
                        </Select.Item>
                      );
                    })}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>
  );
};

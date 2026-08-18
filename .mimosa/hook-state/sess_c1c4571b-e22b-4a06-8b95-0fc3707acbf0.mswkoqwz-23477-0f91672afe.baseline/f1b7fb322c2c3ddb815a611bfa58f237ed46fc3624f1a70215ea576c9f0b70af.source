import { IconTrash } from '@tabler/icons-react';
import {
  Button,
  InfoCard,
  Label,
  Select,
  SkeletonArray,
  toast,
  useConfirm,
} from 'erxes-ui';
import { useAgencyMembers } from '../hooks/useAgencyMembers';
import { MembersInline } from 'ui-modules';
import { AddAgencyMember } from './AddAgencyMember';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useRemoveMember } from '../hooks/useRemoveMember';
import { GET_AGENCY_MEMBERS } from '../graphql';
import { useUpdateMember } from '../hooks/useUpdateMember';

export const AgencyMembers = () => {
  const { agencyInfo } = useAgencyInfo();
  const { agencyMembers, loading } = useAgencyMembers({
    variables: { agencyId: agencyInfo?._id, page: 1, perPage: 10 },
    skip: !agencyInfo?._id,
  });
  return (
    <div className="p-4">
      <InfoCard title="Agency Members" description="v" className="mt-4">
        <InfoCard.Content>
          <div className="grid grid-cols-6 gap-3">
            <Label className="col-span-3" asChild>
              <span>Name</span>
            </Label>
            <Label className="col-span-2" asChild>
              <span>Role</span>
            </Label>
            <Label className="col-span-1" asChild>
              <span>Actions</span>
            </Label>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              <SkeletonArray count={3} />
            </div>
          ) : (
            agencyMembers?.map((member) => (
              <div key={member._id} className="grid grid-cols-6 gap-3">
                <div className="col-span-3 flex gap-2 items-center font-medium">
                  <MembersInline memberIds={[member.memberId]} />
                </div>
                <div className="col-span-2 inline-flex gap-2 items-center font-medium">
                  <AgencyMemberRole
                    role={member?.role as string}
                    id={member._id}
                    agencyId={agencyInfo?._id}
                  />
                </div>
                <div className="col-span-1 flex gap-2 items-center font-medium">
                  <AgencyMemberDelete
                    memberId={member._id}
                    id={agencyInfo?._id}
                  />
                </div>
              </div>
            ))
          )}
          <AddAgencyMember
            members={agencyMembers?.map((member) => member.memberId)}
          />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyMemberDelete = ({
  memberId,
  id,
}: {
  memberId: string;
  id: string;
}) => {
  const { removeMember } = useRemoveMember();
  const { confirm } = useConfirm();

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => {
        confirm({
          message: 'Are you sure you want to delete this member?',
          options: {
            okLabel: 'Delete',
          },
        }).then(() => {
          removeMember({
            variables: { id: memberId },
            refetchQueries: [
              {
                query: GET_AGENCY_MEMBERS,
                variables: { agencyId: id, page: 1, perPage: 10 },
              },
            ],
            onError: (error) =>
              toast({
                variant: 'destructive',
                title: 'Error occurred',
                description: error.message,
              }),
          });
        });
      }}
      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
    >
      <IconTrash />
    </Button>
  );
};

export const AgencyMemberRole = ({
  role,
  id,
  agencyId,
}: {
  role: string;
  id: string;
  agencyId?: string;
}) => {
  const { updateMember } = useUpdateMember();
  const handleUpdateRole: ((value: string) => void) | undefined = (
    value: string,
  ) => {
    updateMember({
      variables: { id, input: { role: value } },
      refetchQueries: [
        {
          query: GET_AGENCY_MEMBERS,
          variables: { agencyId, page: 1, perPage: 10 },
        },
      ],
      onCompleted: () => {
        toast({ title: 'Successfully updated member role' });
      },
      onError: (error) => {
        toast({
          title: 'Error updating member role',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  return (
    <Select value={role} onValueChange={handleUpdateRole}>
      <Select.Trigger className="h-8 w-auto min-w-32">
        <Select.Value placeholder="Select role" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="admin">Admin</Select.Item>
        <Select.Item value="lead">Lead</Select.Item>
        <Select.Item value="member">Member</Select.Item>
      </Select.Content>
    </Select>
  );
};

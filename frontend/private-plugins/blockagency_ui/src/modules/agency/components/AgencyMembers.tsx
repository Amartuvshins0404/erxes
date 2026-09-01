import { IconDots, IconTrash } from '@tabler/icons-react';
import {
  Button,
  Combobox,
  Command,
  InfoCard,
  Label,
  PopoverScoped,
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
import { useIsAgencyAdmin } from '@/member/hooks/useIsAgencyAdmin';
import { useState } from 'react';

export const AgencyMembers = () => {
  const { agencyInfo } = useAgencyInfo();
  const { agencyMembers, loading } = useAgencyMembers({
    variables: { agencyId: agencyInfo?._id, page: 1, perPage: 10 },
    skip: !agencyInfo?._id,
  });
  // Only agency admins manage members. The API rejects the mutations either
  // way; hiding the controls keeps the table honest about what is allowed.
  const { isAgencyAdmin } = useIsAgencyAdmin();

  return (
    <div className="p-4">
      <InfoCard title="Agency Members" description="v" className="mt-4">
        <InfoCard.Content>
          <div className="inline-flex items-center gap-3">
            <Label className="w-8 flex-none">
              <span className="sr-only">Actions</span>
            </Label>
            <Label className="flex-1" asChild>
              <span>Name</span>
            </Label>
            <Label className="w-32 flex-none" asChild>
              <span>Role</span>
            </Label>
            {/* <Label className="col-span-1" asChild>
              <span>Actions</span>
            </Label> */}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              <SkeletonArray count={2} />
            </div>
          ) : (
            agencyMembers?.map((member) => (
              <div key={member._id} className="inline-flex items-center gap-3">
                <div className="flex-none w-8 flex gap-2 items-center font-medium">
                  {isAgencyAdmin && (
                    <AgencyMemberInlineMore
                      memberId={member._id}
                      agencyId={agencyInfo?._id}
                    />
                  )}
                </div>
                <div className="flex-1 flex gap-2 items-center font-medium">
                  <MembersInline memberIds={[member.memberId]} />
                </div>
                <div className="flex-none inline-flex gap-2 items-center font-medium">
                  <AgencyMemberRole
                    role={member?.role as string}
                    id={member._id}
                    agencyId={agencyInfo?._id}
                    disabled={!isAgencyAdmin}
                  />
                </div>
              </div>
            ))
          )}
          {isAgencyAdmin && (
            <AddAgencyMember
              members={agencyMembers?.map((member) => member.memberId)}
            />
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyMemberInlineMore = ({
  memberId,
  agencyId,
}: {
  memberId: string;
  agencyId: string;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const { removeMember } = useRemoveMember();
  const { confirm } = useConfirm();

  function handleDelete(id: string) {
    confirm({
      message: 'Are you sure you want to delete this member?',
      options: {
        okLabel: 'Delete',
      },
    }).then(() => {
      removeMember({
        variables: { id },
        refetchQueries: [
          {
            query: GET_AGENCY_MEMBERS,
            variables: { agencyId, page: 1, perPage: 10 },
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
  }
  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Combobox.TriggerBase
        className="p-0 items-center justify-center"
        size="icon"
        variant={'ghost'}
      >
        <IconDots size={16} />
      </Combobox.TriggerBase>
      <Combobox.Content>
        <Command>
          <Command.List>
            <Command.Item
              onSelect={handleDelete}
              value={memberId}
              className="text-destructive bg-secondary/20 cursor-pointer"
            >
              <IconTrash />
              Delete
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </PopoverScoped>
  );
};

export const AgencyMemberRole = ({
  role,
  id,
  agencyId,
  disabled,
}: {
  role: string;
  id: string;
  agencyId?: string;
  disabled?: boolean;
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
    <Select value={role} onValueChange={handleUpdateRole} disabled={disabled}>
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

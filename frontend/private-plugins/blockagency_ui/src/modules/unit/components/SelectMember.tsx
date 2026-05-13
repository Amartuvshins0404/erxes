import {
  Combobox,
  Command,
  PopoverScoped,
  RecordTableInlineCell,
} from 'erxes-ui';
import { useAgencyMembers } from '../../agency/hooks/useAgencyMembers';
import { useAssignUnitMember } from '../hooks/useAssignUnitMember';
import { useState } from 'react';
import { MembersInline } from 'ui-modules';

interface SelectMemberProps {
  unitId: string;
  memberId?: string;
}

export const SelectMember = ({ unitId, memberId }: SelectMemberProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const { agencyMembers, loading: membersLoading } = useAgencyMembers();
  const { assignMember, loading: assigning } = useAssignUnitMember();
  const handleChange = (value: string) => {
    const next = value === 'unassigned' ? undefined : value;
    assignMember(unitId, next);
  };

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <RecordTableInlineCell.Trigger>
        <MemberInline memberId={memberId} />
      </RecordTableInlineCell.Trigger>
      <RecordTableInlineCell.Content>
        <Command>
          <Command.List>
            <Command.Input placeholder="Search member" />
            {agencyMembers.map((m) => (
              <Command.Item
                key={m._id}
                value={m.memberId}
                onSelect={handleChange}
              >
                <MembersInline.Provider memberIds={[m.memberId]}>
                  <MembersInline.Avatar />
                  <MembersInline.Title />
                </MembersInline.Provider>
                <Combobox.Check checked={m.memberId === memberId} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

export const MemberInline = ({ memberId }: { memberId?: string }) => {
  return (
    <MembersInline.Provider memberIds={[memberId as string]}>
      <MembersInline.Avatar />
      <MembersInline.Title />
    </MembersInline.Provider>
  );
};

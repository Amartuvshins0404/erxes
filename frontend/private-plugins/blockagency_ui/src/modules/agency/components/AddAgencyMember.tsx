import { Button, Form, Sheet, Spinner, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Can, SelectMember } from 'ui-modules';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddMember } from '../hooks/useAddMember';
import { GET_AGENCY_MEMBERS } from '../graphql';
import { useAgencyInfo } from '../hooks/useAgencyInfo';

export const AddAgencyMember = ({ members }: { members: string[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add Member
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Add Member</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {open && <AddAgencyMemberForm setOpen={setOpen} members={members} />}
      </Sheet.View>
    </Sheet>
  );
};

export const AddAgencyMemberForm = ({
  setOpen,
  members,
}: {
  setOpen: (open: boolean) => void;
  members: string[];
}) => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm({
    resolver: zodResolver(
      z.object({
        memberIds: z.array(z.string()),
      }),
    ),
    defaultValues: {
      memberIds: [],
    },
  });
  const { addMember, loading } = useAddMember();

  const onSubmit = (data: { memberIds: string[] }) => {
    const newMemberIds = data.memberIds.filter(
      (id) => !members.some((member) => member === id),
    );
    addMember({
      variables: { agencyId: agencyInfo?._id, memberIds: newMemberIds },
      onCompleted: () => {
        toast({ title: 'Successfully added members' });
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: 'Error adding members',
          description: error.message,
          variant: 'destructive',
        });
      },
      refetchQueries: [
        {
          query: GET_AGENCY_MEMBERS,
          variables: { agencyId: agencyInfo?._id, page: 1, perPage: 10 },
        },
      ],
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-auto flex-col"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="p-6 blk:space-y-5">
          <Form.Field
            control={form.control}
            name="memberIds"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Member</Form.Label>
                <Form.Control>
                  <SelectMember.FormItem
                    value={field.value}
                    onValueChange={field.onChange}
                    mode="multiple"
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Can action="memberCreate">
            <Button type="submit" disabled={loading}>
              <Spinner show={loading} />
              Add Member
            </Button>
          </Can>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

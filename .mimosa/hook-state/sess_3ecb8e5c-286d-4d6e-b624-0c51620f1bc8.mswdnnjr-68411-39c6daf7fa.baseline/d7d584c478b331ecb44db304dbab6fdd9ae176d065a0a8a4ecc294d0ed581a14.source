import { Button, Form, Sheet, Spinner, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SelectMember } from 'ui-modules';
import { useAddProjectMembers } from '../hooks/useProjectMembers';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router';
import { BLOCK_GET_PROJECT_MEMBERS } from '@/project/graphql/projectQueries';

export const ProjectDetailAddMember = ({ members }: { members: string[] }) => {
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
        {open && (
          <ProjectDetailAddMemberForm setOpen={setOpen} members={members} />
        )}
      </Sheet.View>
    </Sheet>
  );
};

export const ProjectDetailAddMemberForm = ({
  setOpen,
  members,
}: {
  setOpen: (open: boolean) => void;
  members: string[];
}) => {
  const { id } = useParams();
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
  const { addProjectMembers, loading } = useAddProjectMembers();

  const onSubmit = (data: { memberIds: string[] }) => {
    const newMemberIds = data.memberIds.filter(
      (id) => !members.some((member) => member === id),
    );
    addProjectMembers({
      variables: { project: id, memberIds: newMemberIds },
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
        { query: BLOCK_GET_PROJECT_MEMBERS, variables: { project: id } },
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
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Add Member
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

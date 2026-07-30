import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Combobox,
  Form,
  Input,
  PopoverScoped,
  Sheet,
  Textarea,
  useToast,
} from 'erxes-ui';
import { IconBuilding, IconSettings } from '@tabler/icons-react';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { currentUserState, IUser, SelectMember } from 'ui-modules';
import { z } from 'zod';
import { DestroyServerDialog } from '~/modules/deploy/components/DestroyServerDialog';
import { useDeleteIdentifier } from '../hooks/useDeleteAssistantOrg';
import { useInviteIdentifierMembers } from '../hooks/useInviteIdentifierMembers';
import type { Identifier } from '../hooks/useAssistantOrgs';
import { useUpdateIdentifier } from '../hooks/useUpdateAssistantOrg';

const assistantOrgSchema = z.object({
  name: z.string().min(1, 'Server name is required'),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

type AssistantOrgValues = z.infer<typeof assistantOrgSchema>;

interface Props {
  org: Identifier;
  triggerLabel?: string;
}

export const AssistantOrgManageSheet = ({
  org,
  triggerLabel = 'Manage',
}: Props) => {
  const { toast } = useToast();
  const currentUser = useAtomValue(currentUserState) as IUser | null;
  const { updateIdentifier, loading: updating } = useUpdateIdentifier();
  const { deleteIdentifier, loading: deleting } = useDeleteIdentifier();
  const { inviteIdentifierMembers, loading: inviting } =
    useInviteIdentifierMembers();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const kindLabel =
    org.kind === 'assistant'
      ? 'AI Assistant'
      : org.kind === 'agent'
        ? 'AI Agent'
        : 'Identifier';
  const editTitle =
    org.kind === 'assistant'
      ? 'Edit Assistant'
      : org.kind === 'agent'
        ? 'Edit Agent'
        : 'Edit Identifier';
  const serverNamePlaceholder =
    org.kind === 'assistant' ? 'Support Assistant' : 'Frontend Agent';
  const deleteTitle =
    org.kind === 'assistant'
      ? 'Delete AI assistant?'
      : org.kind === 'agent'
        ? 'Delete AI agent?'
        : 'Delete identifier?';
  const namespaceLabel = org.kind === 'agent' ? 'Opencode' : 'OpenClaw';
  const server = org.server;
  const hasNamespace = !!server?.hasNamespace;
  const namespaceName = server?.name?.trim();
  const entityNoun =
    org.kind === 'assistant'
      ? 'AI assistant'
      : org.kind === 'agent'
        ? 'AI agent'
        : 'identifier';
  const baseDeleteDescription = `This will permanently remove this ${entityNoun} identifier from the workspace. This action cannot be undone.`;
  const deleteDescription = hasNamespace
    ? `This will permanently remove this ${entityNoun} identifier and its ${namespaceLabel} namespace${
        namespaceName ? ` (${namespaceName})` : ''
      } from the workspace. Do you want to delete both? This action cannot be undone.`
    : server?.exists
      ? `No ${namespaceLabel} namespace was found — the deployment never finished, so only this ${entityNoun} identifier will be removed from the workspace. This action cannot be undone.`
      : baseDeleteDescription;
  const deleteLabel =
    org.kind === 'assistant'
      ? hasNamespace
        ? 'Delete assistant & namespace'
        : 'Delete AI Assistant'
      : org.kind === 'agent'
        ? hasNamespace
          ? 'Delete agent & namespace'
          : 'Delete AI Agent'
        : 'Delete Identifier';
  const deletingLabel =
    org.kind === 'assistant'
      ? 'Deleting AI Assistant...'
      : org.kind === 'agent'
        ? 'Deleting AI Agent...'
        : 'Deleting Identifier...';
  const canManage =
    !!currentUser?.isOwner || org.createdUserId === currentUser?._id;
  const saving = updating || inviting;
  const memberIds = useMemo(() => org.memberIds || [], [org.memberIds]);

  const form = useForm<AssistantOrgValues>({
    resolver: zodResolver(assistantOrgSchema),
    defaultValues: {
      name: org.name,
      description: org.description || '',
      memberIds,
    },
  });

  useEffect(() => {
    form.reset({
      name: org.name,
      description: org.description || '',
      memberIds,
    });
  }, [form, memberIds, open, org.description, org.name]);

  const onSubmit = async (values: AssistantOrgValues) => {
    if (!canManage) {
      return;
    }

    try {
      await updateIdentifier(org._id, {
        name: values.name,
        description: values.description?.trim() || '',
      });
      await inviteIdentifierMembers(org._id, values.memberIds || []);

      toast({ variant: 'success', title: 'Identifier updated' });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const onDelete = async () => {
    if (!canManage) {
      return;
    }

    await deleteIdentifier(org._id, {
      onCompleted: () => {
        toast({ variant: 'success', title: `${kindLabel} deleted` });
        setDeleteOpen(false);
        setOpen(false);
      },
      onError: (error) =>
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: error.message,
        }),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="outline" className="gap-2">
          <IconSettings className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-xl">
        <Form {...form}>
          <form
            className="flex h-full flex-col gap-0"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Sheet.Header>
              <IconBuilding />
              <Sheet.Title>{editTitle}</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>

            <Sheet.Content className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-5">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">{kindLabel}</h3>
                <p className="text-xs text-muted-foreground">
                  Update the server name and description for this {org.kind === 'assistant' ? 'assistant' : org.kind === 'agent' ? 'agent' : 'identifier'}.
                </p>
              </div>
              <Form.Field
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Server name</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        disabled={!canManage || saving || deleting}
                        autoComplete="off"
                        placeholder={serverNamePlaceholder}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="description"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Description</Form.Label>
                    <Form.Control>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        disabled={!canManage || saving || deleting}
                        rows={5}
                        className="resize-none"
                        placeholder="What this identifier is used for"
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="memberIds"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Invited members</Form.Label>
                    <Form.Control>
                      <SelectMember.Provider
                        value={field.value || []}
                        onValueChange={(value) =>
                          field.onChange(Array.isArray(value) ? value : [])
                        }
                        mode="multiple"
                      >
                        {canManage ? (
                          <PopoverScoped>
                            <Combobox.Trigger
                              className="w-full h-10 rounded-lg border bg-background"
                              disabled={saving || deleting}
                            >
                              <SelectMember.Value placeholder="Select team members" />
                            </Combobox.Trigger>
                            <Combobox.Content>
                              <SelectMember.Content />
                            </Combobox.Content>
                          </PopoverScoped>
                        ) : (
                          <div className="flex min-h-10 items-center rounded-lg border bg-muted/30 px-3 py-2">
                            <SelectMember.Value placeholder="No invited members" />
                          </div>
                        )}
                      </SelectMember.Provider>
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </Sheet.Content>

            <Sheet.Footer>
              <div className="flex w-full items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!canManage || saving || deleting}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || deleting}
                    onClick={() => {
                      form.reset({
                        name: org.name,
                        description: org.description || '',
                        memberIds,
                      });
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canManage || saving || deleting}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </Sheet.Footer>
          </form>
        </Form>
        <DestroyServerDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={onDelete}
          loading={deleting}
          title={deleteTitle}
          description={deleteDescription}
          confirmLabel={deleteLabel}
          loadingLabel={deletingLabel}
          onAfterConfirm={() => setOpen(false)}
        />
      </Sheet.View>
    </Sheet>
  );
};

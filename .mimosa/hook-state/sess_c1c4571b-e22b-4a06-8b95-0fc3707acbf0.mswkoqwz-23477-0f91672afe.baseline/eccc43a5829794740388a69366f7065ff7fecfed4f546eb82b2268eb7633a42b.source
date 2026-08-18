import {
  IconArrowRight,
  IconBuilding,
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  Breadcrumb,
  Button,
  Form,
  Input,
  Separator,
  Spinner,
  Textarea,
  useToast,
} from 'erxes-ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageHeader } from 'ui-modules';
import { z } from 'zod';
import { AssistantOrgManageSheet } from '~/modules/assistant-orgs/components/AssistantOrgManageSheet';
import { useAssistantOrgs } from '~/modules/assistant-orgs/hooks/useAssistantOrgs';
import { useCreateAssistantOrg } from '~/modules/assistant-orgs/hooks/useCreateAssistantOrg';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export const IndexPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orgs, loading } = useAssistantOrgs();
  const { createOrg, loading: creating } = useCreateAssistantOrg();
  const [open, setOpen] = useState(false);
  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: CreateOrgValues) => {
    await createOrg(
      {
        name: values.name,
        description: values.description?.trim() || '',
      },
      {
      onCompleted: (orgId) => {
        form.reset();
        setOpen(false);
        if (orgId) {
          navigate(`/agent/orgs/${orgId}`);
        }
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Create failed',
          description: error.message,
        });
      },
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/agent/agent">
                    <IconSparkles />
                    AI assistant
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Assistant Organizations
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose the org you want to manage. Each org owns its own
                OpenClaw and Opencode deployments.
              </p>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <IconPlus className="h-4 w-4" />
              Create org
            </Button>
          </div>

          {loading ? (
            <Spinner />
          ) : orgs.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconBuilding className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">No organizations yet</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Create your first assistant organization before deploying
                  OpenClaw or Opencode.
                </p>
              </div>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                Create first org
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {orgs.map((org) => (
                <div
                  key={org._id}
                  className="group flex min-h-52 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconBuilding className="h-6 w-6" />
                    </div>
                    <AssistantOrgManageSheet org={org} />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-card-foreground">
                      {org.name}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {org.description?.trim() ||
                        'Open the assistant environments for this org and manage its OpenClaw and Opencode deployments.'}
                    </p>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    className="mt-auto w-fit gap-1 px-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary"
                  >
                    <Link to={`/agent/orgs/${org._id}`}>
                      Open organization <IconArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={open}>
        <AlertDialog.Content className="sm:max-w-md">
          <AlertDialog.Header>
            <AlertDialog.Title>Create organization</AlertDialog.Title>
            <AlertDialog.Description>
              Add a team like Operations Team, Support Team, or Growth Team.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <Form.Field
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Organization name</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder="Operations Team"
                        autoComplete="off"
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
                        rows={4}
                        className="resize-none"
                        placeholder="What this org handles"
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <AlertDialog.Footer className="flex gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={creating}
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </AlertDialog.Footer>
            </form>
          </Form>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};

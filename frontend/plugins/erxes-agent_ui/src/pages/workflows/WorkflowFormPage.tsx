import { useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  IconArrowLeft,
  IconBraces,
  IconCircleCheck,
  IconCode,
  IconEye,
  IconInfoCircle,
  IconSitemap,
  IconWand,
} from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  Separator,
  Tabs,
  Textarea,
  toast,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { usePermissionCheck } from 'ui-modules';
import { FormSection } from '~/components/FormLayout';
import { useResourceForm } from '~/components/useResourceForm';
import { WorkflowGraph } from './graph/WorkflowGraph';
import { useWorkflow } from './hooks/useWorkflow';
import { useWorkflowFormMutations } from './hooks/useWorkflowMutations';
import { IWorkflow, IWorkflowDefinition, IWorkflowValidation } from './types';
import { workflowFormSchema, WorkflowFormValues } from './validations';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

// Minimal valid starter so a hand-authored workflow begins from a runnable shape.
const TEMPLATE: IWorkflowDefinition = {
  trigger: { type: 'manual', config: {} },
  policy: { mode: 'custom', allowed: [] },
  bindings: {},
  limits: { maxLlmCalls: 10 },
  steps: [
    { id: 'done', type: 'end', output: { message: 'Hello from workflow' } },
  ],
};

const DEFAULT_VALUES: WorkflowFormValues = {
  name: '',
  description: '',
  definitionText: JSON.stringify(TEMPLATE, null, 2),
};

/** Safe parse of the controlled JSON text field; null when it does not parse. */
const parseDefinition = (text: string): IWorkflowDefinition | null => {
  try {
    return JSON.parse(text) as IWorkflowDefinition;
  } catch {
    return null;
  }
};

export const WorkflowFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const { hasActionPermission, isLoaded: permissionsLoaded } =
    usePermissionCheck();
  const canCreate = hasActionPermission(
    ERXES_AGENT_ACTIONS.workflow.createDraft,
  );
  // New workflows opened from an agent workspace inherit that business agentId.
  const presetAgentId = searchParams.get('agentId') || undefined;

  const [validation, setValidation] = useState<IWorkflowValidation | null>(
    null,
  );
  const [editorView, setEditorView] = useState<'code' | 'preview'>('code');

  const { workflow } = useWorkflow(id, !isEdit);

  const form = useResourceForm<WorkflowFormValues, IWorkflow>({
    schema: workflowFormSchema,
    defaults: DEFAULT_VALUES,
    isEdit,
    record: workflow,
    load: (workflow) => ({
      name: workflow.name || '',
      description: workflow.description || '',
      definitionText: JSON.stringify(workflow.definition ?? {}, null, 2),
    }),
  });

  const {
    validate,
    validating,
    createWorkflow,
    creating,
    updateWorkflow,
    updating,
  } = useWorkflowFormMutations({
    onValidated: setValidation,
    onCreated: (newId) =>
      navigate(
        newId ? `/erxes-agent/workflows/${newId}` : '/erxes-agent/workflows',
      ),
    onUpdated: () => navigate(`/erxes-agent/workflows/${id}`),
  });

  const definitionText = form.watch('definitionText');

  // Live graph preview — renders whenever the JSON parses (independent of the
  // server-side Validate verdict).
  const previewDefinition = useMemo(
    () => parseDefinition(definitionText),
    [definitionText],
  );

  const handleValidate = () => {
    const definition = parseDefinition(definitionText);
    if (!definition) {
      setValidation({
        ok: false,
        errors: [{ path: '(json)', message: 'Definition must be valid JSON' }],
      });
      return;
    }
    validate(definition);
  };

  const handleFormat = () => {
    if (!previewDefinition) return;
    form.setValue(
      'definitionText',
      JSON.stringify(previewDefinition, null, 2),
      { shouldDirty: true, shouldValidate: true },
    );
    setValidation(null);
  };

  const onSubmit = (values: WorkflowFormValues) => {
    const definition = parseDefinition(values.definitionText);
    if (!definition) {
      toast({
        title: 'Invalid definition',
        description: 'Definition must be valid JSON',
        variant: 'destructive',
      });
      return;
    }

    const doc = {
      name: values.name,
      description: values.description,
      definition,
      // Only stamp the owner on create; edits keep their existing agentId.
      ...(!isEdit && presetAgentId ? { agentId: presetAgentId } : {}),
    };
    if (isEdit) updateWorkflow({ variables: { _id: id, doc } });
    else createWorkflow({ variables: { doc } });
  };

  const isSaving = creating || updating;
  const name = form.watch('name');
  const canEdit = workflow?.capabilities.canUpdate ?? false;

  if (
    permissionsLoaded &&
    ((!isEdit && (!canCreate || !presetAgentId)) ||
      (isEdit && workflow && !canEdit))
  ) {
    return <Navigate to="/erxes-agent/workflows" replace />;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/erxes-agent/workflows">
                    <IconSitemap />
                    Workflows
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="max-w-48 truncate text-muted-foreground">
                  {isEdit ? workflow?.name || 'Edit workflow' : 'New workflow'}
                </span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <Button variant="outline" asChild>
            <Link to="/erxes-agent/workflows">
              <IconArrowLeft /> Back
            </Link>
          </Button>
          <Button
            type="submit"
            form="workflow-form"
            disabled={isSaving || !name}
          >
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create workflow'}
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="flex-1 overflow-auto bg-muted/20">
        <Form {...form}>
          <form
            id="workflow-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:p-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
          >
            <Card className="min-w-0 overflow-hidden shadow-none">
              <Card.Header className="flex-row items-start justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                  <Card.Title className="text-base">
                    Workflow builder
                  </Card.Title>
                  <Card.Description>
                    Edit the definition as JSON or inspect its visual flow.
                  </Card.Description>
                </div>
                <Badge
                  variant={
                    validation?.ok
                      ? 'success'
                      : previewDefinition
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="shrink-0"
                >
                  {validation?.ok
                    ? 'Validated'
                    : previewDefinition
                    ? 'Valid JSON'
                    : 'Invalid JSON'}
                </Badge>
              </Card.Header>

              <Card.Content className="p-0">
                <Tabs
                  value={editorView}
                  onValueChange={(value) =>
                    setEditorView(value === 'preview' ? 'preview' : 'code')
                  }
                >
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                    <Tabs.List>
                      <Tabs.Trigger value="code">
                        <IconCode className="mr-1.5 size-4" />
                        Code
                      </Tabs.Trigger>
                      <Tabs.Trigger value="preview">
                        <IconEye className="mr-1.5 size-4" />
                        Preview
                      </Tabs.Trigger>
                    </Tabs.List>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleFormat}
                      disabled={!previewDefinition}
                    >
                      <IconWand />
                      Format JSON
                    </Button>
                  </div>

                  <Tabs.Content value="code" className="m-0">
                    <Form.Field
                      control={form.control}
                      name="definitionText"
                      render={({ field }) => (
                        <Form.Item className="space-y-0">
                          <Form.Control>
                            <Textarea
                              aria-label="Workflow definition"
                              value={field.value}
                              onChange={(event) => {
                                field.onChange(event.target.value);
                                setValidation(null);
                              }}
                              onBlur={field.onBlur}
                              className="min-h-[28rem] resize-y rounded-none border-0 bg-transparent px-4 py-4 font-mono text-xs leading-5 focus-visible:ring-0 sm:min-h-[36rem] sm:px-5"
                              spellCheck={false}
                            />
                          </Form.Control>
                          <Form.Message className="px-5 pb-3" />
                        </Form.Item>
                      )}
                    />

                    <div className="flex flex-wrap items-center gap-3 border-t bg-muted/20 px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidate}
                        disabled={validating}
                      >
                        <IconCircleCheck />
                        {validating ? 'Validating…' : 'Validate definition'}
                      </Button>
                      {validation?.ok ? (
                        <span className="flex items-center gap-1.5 text-sm text-success">
                          <IconCircleCheck className="size-4" />
                          Ready to save
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Validation checks step references, policies, and
                          limits.
                        </span>
                      )}
                    </div>

                    {validation && !validation.ok && (
                      <div className="border-t p-4">
                        <Alert variant="destructive">
                          <Alert.Title>
                            {validation.errors?.length || 0} validation error
                            {(validation.errors?.length || 0) !== 1 ? 's' : ''}
                          </Alert.Title>
                          <Alert.Description>
                            <ul className="mt-1 space-y-1">
                              {(validation.errors || []).map((error) => (
                                <li
                                  key={`${error.path ?? ''}|${error.message}`}
                                  className="text-sm"
                                >
                                  {error.path && (
                                    <code className="mr-1.5 font-mono text-xs">
                                      {error.path}
                                    </code>
                                  )}
                                  {error.message}
                                </li>
                              ))}
                            </ul>
                          </Alert.Description>
                        </Alert>
                      </div>
                    )}
                  </Tabs.Content>

                  <Tabs.Content value="preview" className="m-0">
                    {previewDefinition ? (
                      <WorkflowGraph
                        definition={previewDefinition}
                        className="h-[30rem] border-0 bg-muted/10 sm:h-[42rem]"
                      />
                    ) : (
                      <div className="flex h-[30rem] flex-col items-center justify-center gap-2 px-6 text-center sm:h-[42rem]">
                        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                          <IconBraces className="size-6" />
                        </div>
                        <p className="font-medium">Preview unavailable</p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                          Fix the JSON syntax in the Code tab to restore the
                          workflow diagram.
                        </p>
                      </div>
                    )}
                  </Tabs.Content>
                </Tabs>
              </Card.Content>
            </Card>

            <aside className="space-y-4 self-start xl:sticky xl:top-4">
              <FormSection
                title="Workflow details"
                description="Give teammates enough context to recognize this workflow."
              >
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Name</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Daily lead follow-up" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Description</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="What this workflow does"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </FormSection>

              <FormSection
                title="Definition guide"
                description="Quick reference for the workflow DSL."
              >
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    STEP TYPES
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['operation', 'agent', 'branch', 'parallel', 'end'].map(
                      (type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="font-mono font-normal"
                        >
                          {type}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Reference trigger data with
                      <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono">
                        {'{{trigger.payload.x}}'}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Reference earlier outputs with
                      <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono">
                        {'{{steps.<id>.output.x}}'}
                      </code>
                    </p>
                  </div>
                </div>
              </FormSection>

              <div className="flex gap-2 sm:hidden">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSaving || !name}
                >
                  {isSaving
                    ? 'Saving…'
                    : isEdit
                    ? 'Save changes'
                    : 'Create workflow'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/erxes-agent/workflows">Cancel</Link>
                </Button>
              </div>
            </aside>
          </form>
        </Form>
      </div>
    </div>
  );
};

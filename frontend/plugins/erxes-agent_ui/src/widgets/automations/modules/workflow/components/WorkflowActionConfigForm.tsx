import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Select, Spinner } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import {
  AutomationActionFormProps,
  useAutomationRemoteFormSubmit,
  useFormValidationErrorHandler,
} from 'ui-modules';
import { useWorkflows } from '~/pages/workflows/hooks/useWorkflows';
import {
  TWorkflowActionConfigForm,
  workflowActionConfigFormSchema,
} from '../states/workflowActionConfigForm';

// Sidebar config form for the "Run agent workflow" action. The action's only
// input is which Mastra workflow to run, so the form is a single workflow
// picker. Submission is driven by the builder's shared save button via
// `useAutomationRemoteFormSubmit` (formRef.submit()), matching the pattern the
// other plugins' remote action forms use.
export const WorkflowActionConfigForm = ({
  formRef,
  onSaveActionConfig,
  currentAction,
}: AutomationActionFormProps<TWorkflowActionConfigForm>) => {
  const { workflows, loading } = useWorkflows();

  const form = useForm<TWorkflowActionConfigForm>({
    resolver: zodResolver(workflowActionConfigFormSchema),
    defaultValues: {
      workflowId: '',
      ...(currentAction?.config || {}),
    },
  });
  const { control, handleSubmit } = form;

  const { handleValidationErrors } = useFormValidationErrorHandler({
    formName: 'Run agent workflow action configuration',
  });

  useAutomationRemoteFormSubmit({
    formRef,
    callback: () => {
      handleSubmit(onSaveActionConfig, handleValidationErrors)();
    },
  });

  return (
    <Form {...form}>
      <Form.Field
        control={control}
        name="workflowId"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Workflow</Form.Label>
            {loading ? (
              <Spinner />
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <Select.Trigger className="mt-1">
                  <Select.Value placeholder="Select a workflow" />
                </Select.Trigger>
                <Select.Content>
                  {workflows.map((workflow) => (
                    <Select.Item
                      key={workflow._id}
                      value={workflow._id}
                      disabled={!workflow.isEnabled}
                    >
                      {workflow.name}
                      {workflow.isEnabled ? '' : ' (disabled)'}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
            <Form.Message />
          </Form.Item>
        )}
      />
    </Form>
  );
};

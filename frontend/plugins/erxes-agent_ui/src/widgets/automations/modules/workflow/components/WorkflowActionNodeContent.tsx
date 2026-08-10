import { AutomationActionNodeConfigProps } from 'ui-modules';
import { useWorkflows } from '~/pages/workflows/hooks/useWorkflows';
import { TWorkflowActionConfigForm } from '../states/workflowActionConfigForm';

// Compact summary shown on the action node inside the builder canvas: the name
// of the workflow this action will run, or a hint to configure it.
export const WorkflowActionNodeContent = ({
  config,
}: AutomationActionNodeConfigProps<TWorkflowActionConfigForm>) => {
  const { workflows } = useWorkflows();
  const workflowId = config?.workflowId;

  if (!workflowId) {
    return (
      <p className="text-sm text-muted-foreground">No workflow selected</p>
    );
  }

  const workflow = workflows.find(({ _id }) => _id === workflowId);

  return (
    <p className="text-sm text-muted-foreground">
      Runs workflow:{' '}
      <span className="font-medium text-foreground">
        {workflow?.name || workflowId}
      </span>
    </p>
  );
};

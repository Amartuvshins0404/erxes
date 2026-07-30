import { Spinner } from 'erxes-ui';
import { ComponentType, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AutomationRemoteEntryProps } from 'ui-modules';

// Federated entry for the automations builder (exposed as `./automationsWidget`
// in module-federation.config.ts). Core's RenderPluginsComponentWrapper loads
// this and passes the action's `moduleName` (parsed from the node type, e.g.
// `erxes-agent:workflow.workflows.create` → `workflow`); we route to the
// matching module remote. Mirrors the pattern the other plugins use.
const WorkflowRemoteEntry = lazy(() =>
  import('../modules/workflow/components/WorkflowRemoteEntry').then(
    (module) => ({
      default: module.WorkflowRemoteEntry,
    }),
  ),
);

const Remotes: Record<
  string,
  React.LazyExoticComponent<ComponentType<AutomationRemoteEntryProps>>
> = {
  workflow: WorkflowRemoteEntry,
};

export const AutomationRemoteEntries = ({
  moduleName,
  ...props
}: AutomationRemoteEntryProps & { moduleName: string }) => {
  const RemoteComponent = Remotes[moduleName];

  if (!RemoteComponent) return null;

  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary FallbackComponent={() => <div>Error</div>}>
        <RemoteComponent {...(props as AutomationRemoteEntryProps)} />
      </ErrorBoundary>
    </Suspense>
  );
};

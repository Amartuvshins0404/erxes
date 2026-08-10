import { lazy } from 'react';
import {
  AutomationRemoteEntryProps,
  AutomationRemoteEntryWrapper,
} from 'ui-modules';

// Per-componentType dispatch for the `workflow` module. The automations builder
// asks the same remote for different pieces (the sidebar config form, the
// on-canvas node summary, …) via `componentType`; the wrapper renders the
// matching entry and returns null for the ones we don't provide.
const WorkflowActionConfigForm = lazy(() =>
  import('./WorkflowActionConfigForm').then((module) => ({
    default: module.WorkflowActionConfigForm,
  })),
);

const WorkflowActionNodeContent = lazy(() =>
  import('./WorkflowActionNodeContent').then((module) => ({
    default: module.WorkflowActionNodeContent,
  })),
);

export const WorkflowRemoteEntry = (props: AutomationRemoteEntryProps) => {
  return (
    <AutomationRemoteEntryWrapper
      props={props}
      remoteEntries={{
        actionForm: WorkflowActionConfigForm,
        actionNodeConfiguration: WorkflowActionNodeContent,
      }}
    />
  );
};

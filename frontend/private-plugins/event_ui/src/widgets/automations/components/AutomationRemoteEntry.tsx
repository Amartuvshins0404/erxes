import {
  AutomationRemoteEntryProps,
  AutomationRemoteEntryWrapper,
} from 'ui-modules';
import { EventKnowledgeSourceSelector } from './EventKnowledgeSourceSelector';

type AutomationRemoteEntriesProps = AutomationRemoteEntryProps & {
  moduleName: string;
};

export const AutomationRemoteEntries = ({
  moduleName,
  ...props
}: AutomationRemoteEntriesProps) => {
  if (moduleName !== 'event') {
    return null;
  }

  return (
    <AutomationRemoteEntryWrapper
      props={props}
      remoteEntries={{
        aiKnowledgeSourceSelector: EventKnowledgeSourceSelector,
      }}
    />
  );
};

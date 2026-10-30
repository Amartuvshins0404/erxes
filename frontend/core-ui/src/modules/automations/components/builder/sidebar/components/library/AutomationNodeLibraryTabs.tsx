import { useAutomationBuilderSidebarHooks } from '@/automations/components/builder/sidebar/hooks/useAutomationBuilderSidebarHooks';
import { AUTOMATION_LIBRARY_TABS } from '@/automations/constants';
import { useAutomation } from '@/automations/context/AutomationProvider';
import { useWorkflowEditScope } from '@/automations/context/WorkflowEditScopeProvider';
import { automationEdgeInsertTargetState } from '@/automations/states/automationState';
import { AutomationNodeType } from '@/automations/types';
import { Tabs } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

export const AutomationNodeLibraryTabs = ({
  activeNodeTab,
}: {
  activeNodeTab: AutomationNodeType;
}) => {
  const { t } = useTranslation('automations');
  const { awaitingToConnectNodeId } = useAutomation();
  const workflowEditScope = useWorkflowEditScope();
  const edgeInsertTarget = useAtomValue(automationEdgeInsertTargetState);
  const { openNodeLibrary } = useAutomationBuilderSidebarHooks();

  if (awaitingToConnectNodeId || edgeInsertTarget || workflowEditScope) {
    return null;
  }

  const handleTabChange = (next: string) => {
    const tab = AUTOMATION_LIBRARY_TABS.find(({ value }) => value === next);

    if (tab) {
      openNodeLibrary(tab.value);
    }
  };

  return (
    <div className="shrink-0 px-5 pt-4">
      <Tabs value={activeNodeTab} onValueChange={handleTabChange}>
        <Tabs.List variant="segment" className="flex w-full">
          {AUTOMATION_LIBRARY_TABS.map(({ value, labelKey, icon: Icon }) => (
            <Tabs.Trigger key={value} value={value} className="flex-1">
              <Icon className="size-3.5 shrink-0" />
              {t(labelKey)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
    </div>
  );
};

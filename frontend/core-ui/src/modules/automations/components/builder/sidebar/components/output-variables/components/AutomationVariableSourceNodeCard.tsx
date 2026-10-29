import { Button, cn, IconComponent } from 'erxes-ui';
import { TAutomationVariableSourceNode } from '../AutomationVariableBrowserTypes';
import { AutomationNodeType } from '@/automations/types';
import { useTranslation } from 'react-i18next';

export const AutomationVariableSourceNodeCard = ({
  node,
  isSelected,
  onClick,
}: {
  node: TAutomationVariableSourceNode;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { t } = useTranslation('automations');
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        'h-auto w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-3 text-left font-normal',
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
      )}
    >
      {node.icon ? (
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <IconComponent className="size-4" name={node.icon} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{node.label}</div>
        <div className="text-xs text-muted-foreground">
          {node.nodeType === AutomationNodeType.Trigger
            ? t('trigger')
            : t('action')}
        </div>
      </div>
    </Button>
  );
};

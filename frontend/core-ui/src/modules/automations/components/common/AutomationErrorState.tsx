import {
  IconAlertTriangle,
  IconChevronDown,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { Badge, Button, Collapsible, Empty, cn } from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AutomationErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string;
  errorDetails?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AutomationErrorState({
  title = 'An error occurred',
  description,
  errorCode,
  errorDetails,
  onRetry,
  onDismiss,
}: AutomationErrorStateProps) {
  const { t } = useTranslation('automations');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Empty className="relative max-w-full gap-4 overflow-auto rounded-xl border border-destructive/20 bg-destructive/5 p-6">
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 rounded-full text-muted-foreground"
          onClick={onDismiss}
        >
          <IconX />
          <span className="sr-only">{t('common-dismiss')}</span>
        </Button>
      )}
      <Empty.Header>
        <Empty.Media variant="icon" className="bg-destructive/10">
          <IconAlertTriangle className="text-destructive" />
        </Empty.Media>
        <Empty.Title>{title}</Empty.Title>
        {description && (
          <Empty.Description className="break-words">
            {description}
          </Empty.Description>
        )}
      </Empty.Header>
      {(errorCode || errorDetails || onRetry) && (
        <Empty.Content className="max-w-full">
          {errorCode && (
            <Badge variant="destructive" className="font-mono">
              {errorCode}
            </Badge>
          )}
          {errorDetails && (
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="w-full"
            >
              <Collapsible.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                >
                  {isOpen ? t('common-hide-details') : t('common-show-details')}
                  <IconChevronDown
                    className={cn(
                      'transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content className="mt-2">
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
                  {errorDetails}
                </pre>
              </Collapsible.Content>
            </Collapsible>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <IconRefresh />
              {t('common-try-again')}
            </Button>
          )}
        </Empty.Content>
      )}
    </Empty>
  );
}

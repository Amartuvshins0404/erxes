import { useTranslation } from 'react-i18next';
import { Button, Textarea } from 'erxes-ui';

interface JSONRawEditorProps {
  isOpen: boolean;
  value: string;
  onToggle: () => void;
  onApply: () => void;
  onChange: (value: string) => void;
}

export function JSONRawEditor({
  isOpen,
  value,
  onToggle,
  onApply,
  onChange,
}: JSONRawEditorProps) {
  const { t } = useTranslation('automations');

  return (
    <div className="mt-2 rounded-lg border bg-muted/30 p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-muted-foreground">
          {t('webhook-json-summary')}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onToggle}>
            {isOpen ? t('webhook-json-hide-raw') : t('webhook-json-edit-raw')}
          </Button>
          {isOpen && (
            <Button size="sm" onClick={onApply}>
              {t('apply')}
            </Button>
          )}
        </div>
      </div>

      {isOpen ? (
        <Textarea
          className="h-40 font-mono text-[11px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <JSONPreview value={value} />
      )}
    </div>
  );
}

function JSONPreview({ value }: { value: string }) {
  const jsonString = (() => {
    try {
      return JSON.stringify(JSON.parse(value || '{}'), null, 2);
    } catch {
      return value;
    }
  })();

  return (
    <pre className="text-[11px] leading-4 overflow-auto max-h-56 font-mono whitespace-pre-wrap">
      {jsonString}
    </pre>
  );
}

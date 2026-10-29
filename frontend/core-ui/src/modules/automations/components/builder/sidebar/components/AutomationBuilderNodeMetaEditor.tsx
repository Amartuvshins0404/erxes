import { useNodeMetaEdit } from '@/automations/components/builder/sidebar/hooks/useNodeMetaEdit';
import { NodeData } from '@/automations/types';
import { Button, Input, cn } from 'erxes-ui';
import { KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

// In-place editing of the active node's label/description in the sidebar
// header, for every node type (trigger, action, workflow).
export const AutomationBuilderNodeMetaEditor = ({
  activeNode,
}: {
  activeNode: NodeData;
}) => {
  const { t } = useTranslation('automations');
  const { updateMeta, activeNodeId } = useNodeMetaEdit(activeNode);

  const [meta, setMeta] = useState({
    label: activeNode.label || '',
    description: activeNode.description || '',
  });

  // Switching to another node resets the local draft
  const [draftNodeId, setDraftNodeId] = useState(activeNodeId);
  if (draftNodeId !== activeNodeId) {
    setDraftNodeId(activeNodeId);
    setMeta({
      label: activeNode.label || '',
      description: activeNode.description || '',
    });
  }

  const handleChange = (field: 'label' | 'description', value: string) => {
    setMeta((previous) => ({ ...previous, [field]: value }));
    updateMeta(field, value);
  };

  return (
    <>
      <AutomationNodeMetaInlineField
        key={`${activeNodeId}-label`}
        value={meta.label}
        placeholder={t('sidebar-untitled')}
        onChange={(value) => handleChange('label', value)}
        className="h-7 text-xl font-semibold leading-tight tracking-tight"
      />
      <AutomationNodeMetaInlineField
        key={`${activeNodeId}-description`}
        value={meta.description}
        placeholder={t('sidebar-add-description')}
        onChange={(value) => handleChange('description', value)}
        className="h-5 text-sm leading-5 text-muted-foreground"
      />
    </>
  );
};

/**
 * Text that turns into an input of the same size where it stands, like an
 * inline table cell. Edits apply as typed; Escape restores the value it had
 * when editing started.
 */
const AutomationNodeMetaInlineField = ({
  value,
  placeholder,
  onChange,
  className,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className: string;
}) => {
  const [initialValue, setInitialValue] = useState<string | null>(null);
  const isEditing = initialValue !== null;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setInitialValue(null);
    }

    if (event.key === 'Escape' && initialValue !== null) {
      event.stopPropagation();
      onChange(initialValue);
      setInitialValue(null);
    }
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setInitialValue(null)}
        className={cn('-mx-1 w-full px-1 py-0', className)}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setInitialValue(value)}
      className={cn(
        '-mx-1 block h-auto w-fit max-w-full truncate rounded-md px-1 py-0 text-left',
        className,
        !value && 'font-normal text-muted-foreground',
      )}
    >
      {value || placeholder}
    </Button>
  );
};

import { Button, Checkbox, Collapsible, Label, Spinner } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import type { PermissionGroupOption } from '../graphql/access';

interface PermissionGroupSelectorProps {
  groups: PermissionGroupOption[];
  value: string[];
  onChange: (groupIds: string[]) => void;
  loading?: boolean;
}

export const PermissionGroupSelector = ({
  groups,
  value,
  onChange,
  loading = false,
}: PermissionGroupSelectorProps) => {
  const { t } = useTranslation('mastra');
  const builtInGroupsByPlugin = new Map<string, PermissionGroupOption[]>();
  const customGroups: PermissionGroupOption[] = [];

  for (const group of groups) {
    if (group.source === 'custom') {
      customGroups.push(group);
      continue;
    }

    const plugin = group.plugin || group.id.split(':')[0] || 'other';
    const pluginGroups = builtInGroupsByPlugin.get(plugin) ?? [];
    pluginGroups.push(group);
    builtInGroupsByPlugin.set(plugin, pluginGroups);
  }

  const categoryNames: Record<string, string> = {
    core: t('agent-settings-permission-category-core'),
    'erxes-agent': t('agent-settings-permission-category-agents'),
  };

  const toggleGroup = (group: PermissionGroupOption, checked: boolean) => {
    if (!checked) {
      onChange(value.filter((id) => id !== group.id));
      return;
    }

    if (value.includes(group.id)) {
      return;
    }

    if (group.source === 'custom') {
      onChange([...value, group.id]);
      return;
    }

    const plugin = group.plugin || group.id.split(':')[0] || 'other';
    const categoryIds = new Set(
      (builtInGroupsByPlugin.get(plugin) ?? []).map(({ id }) => id),
    );

    onChange([...value.filter((id) => !categoryIds.has(id)), group.id]);
  };

  const renderCategory = (
    key: string,
    label: string,
    categoryGroups: PermissionGroupOption[],
  ) => (
    <Collapsible key={key} className="group" defaultOpen>
      <Collapsible.Trigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start font-medium"
        >
          <Collapsible.TriggerIcon />
          <span>{label}</span>
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-2">
        <div className="divide-y overflow-hidden rounded-lg border">
          {categoryGroups.map((group) => {
            const checkboxId = `agent-permission-${group.id}`;
            const selected = value.includes(group.id);

            return (
              <div
                key={group.id}
                className={`flex items-start gap-3 px-3 py-3 transition-colors ${
                  selected ? 'bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <Checkbox
                  id={checkboxId}
                  checked={selected}
                  disabled={loading}
                  onCheckedChange={(checked) =>
                    toggleGroup(group, checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  variant="peer"
                  htmlFor={checkboxId}
                  className="min-w-0 flex-1 cursor-pointer space-y-1"
                >
                  <span className="block text-sm font-medium">
                    {group.name}
                  </span>
                  {group.description && (
                    <span className="block text-xs font-normal leading-relaxed text-muted-foreground">
                      {group.description}
                    </span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible>
  );

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Spinner containerClassName="py-12" />
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {Array.from(builtInGroupsByPlugin.entries()).map(
        ([plugin, categoryGroups]) =>
          renderCategory(
            `built-in-${plugin}`,
            categoryNames[plugin] ??
              plugin
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            categoryGroups,
          ),
      )}
      {customGroups.length > 0 &&
        renderCategory(
          'custom',
          t('agent-settings-permission-custom-groups'),
          customGroups,
        )}
    </div>
  );
};

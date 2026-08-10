import { Checkbox, Collapsible, Label, Spinner } from 'erxes-ui';
import type { PermissionGroupOption } from '../graphql/access';

interface PermissionGroupSelectorProps {
  groups: PermissionGroupOption[];
  value: string[];
  onChange: (groupIds: string[]) => void;
  loading?: boolean;
  idPrefix?: string;
}

export const PermissionGroupSelector = ({
  groups,
  value,
  onChange,
  loading = false,
  idPrefix = 'agent-permission',
}: PermissionGroupSelectorProps) => {
  const builtInGroupsByPlugin = new Map<string, PermissionGroupOption[]>();

  for (const group of groups) {
    if (group.source === 'custom') continue;

    const plugin = group.plugin || group.id.split(':')[0] || 'other';
    const pluginGroups = builtInGroupsByPlugin.get(plugin) ?? [];
    pluginGroups.push(group);
    builtInGroupsByPlugin.set(plugin, pluginGroups);
  }

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

  const renderGroup = (group: PermissionGroupOption) => {
    const checkboxId = `${idPrefix}-${group.id}`;
    const selected = value.includes(group.id);

    return (
      <div
        key={group.id}
        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          selected ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/40'
        }`}
      >
        <Checkbox
          id={checkboxId}
          checked={selected}
          disabled={loading}
          onCheckedChange={(checked) => toggleGroup(group, checked === true)}
          className="mt-0.5"
        />
        <Label
          variant="peer"
          htmlFor={checkboxId}
          className="min-w-0 flex-1 cursor-pointer space-y-0.5"
        >
          <span className="block text-sm font-medium">{group.name}</span>
          {group.description && (
            <span className="block text-xs font-normal leading-snug text-muted-foreground">
              {group.description}
            </span>
          )}
        </Label>
      </div>
    );
  };

  const renderCategory = (
    plugin: string,
    pluginGroups: PermissionGroupOption[],
  ) => {
    const selectedCount = pluginGroups.filter(({ id }) =>
      value.includes(id),
    ).length;

    return (
      <Collapsible
        key={plugin}
        defaultOpen={selectedCount > 0}
        className="overflow-hidden rounded-lg border"
      >
        <Collapsible.TriggerButton
          type="button"
          className="h-9 w-full justify-start rounded-none px-3"
        >
          <Collapsible.TriggerIcon className="mr-2 size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left capitalize">
            {plugin.replace(/[-_]/g, ' ')}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {selectedCount}/{pluginGroups.length}
          </span>
        </Collapsible.TriggerButton>
        <Collapsible.Content className="grid gap-2 border-t bg-muted/10 p-2 md:grid-cols-2">
          {pluginGroups.map(renderGroup)}
        </Collapsible.Content>
      </Collapsible>
    );
  };

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

  const customGroups = groups.filter(({ source }) => source === 'custom');

  return (
    <div className="space-y-2">
      {[...builtInGroupsByPlugin.entries()].map(([plugin, pluginGroups]) =>
        renderCategory(plugin, pluginGroups),
      )}
      {customGroups.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {customGroups.map(renderGroup)}
        </div>
      )}
    </div>
  );
};

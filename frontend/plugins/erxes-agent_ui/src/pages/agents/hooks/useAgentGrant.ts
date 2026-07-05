import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import {
  PERMISSION_MODULES,
  PERMISSION_GROUP_DETAIL,
  PERMISSION_GROUPS,
  PERMISSION_GROUP_ADD,
  PERMISSION_GROUP_EDIT,
} from '../graphql/access';
import { MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { MASTRA_AGENT } from '~/graphql/queries';

export interface PermissionAction {
  name: string;
  title?: string;
  description?: string;
  always?: boolean;
  disabled?: boolean;
}
export interface PermissionModule {
  name: string;
  description?: string;
  actions: PermissionAction[];
}
export interface PermissionModulesByPlugin {
  plugin: string;
  modules: PermissionModule[];
}
interface GroupPermission {
  plugin: string;
  module: string;
  actions: string[];
  scope: string;
}

/** Key a module by plugin+name (module names are only unique within a plugin). */
const keyOf = (plugin: string, module: string) => `${plugin} ${module}`;

/** Deterministic name of an agent's own auto-managed grant group. */
const groupNameFor = (agentId: string) => `agent-grant:${agentId}`;

/** Stable signature of a selection, for dirty detection. */
const signature = (perms: GroupPermission[]) =>
  JSON.stringify(
    perms
      .map((p) => ({ ...p, actions: [...p.actions].sort() }))
      .sort((a, b) =>
        keyOf(a.plugin, a.module).localeCompare(keyOf(b.plugin, b.module)),
      ),
  );

/** Expand the enabled-modules + selected-actions state into group permissions. */
const buildPermissions = (
  enabled: Set<string>,
  selected: Map<string, Set<string>>,
  moduleByKey: Map<string, { plugin: string; module: PermissionModule }>,
): GroupPermission[] => {
  const out: GroupPermission[] = [];
  for (const k of enabled) {
    const meta = moduleByKey.get(k);
    if (!meta) continue;
    const alwaysNames = meta.module.actions
      .filter((a) => a.always)
      .map((a) => a.name);
    const picked = [...(selected.get(k) ?? [])];
    // Explicit names only (never '*') so BOTH the server grant and the derived
    // tool filter resolve concrete actions. View gates ride along automatically.
    const actions = [...new Set([...alwaysNames, ...picked])];
    if (actions.length)
      out.push({
        plugin: meta.plugin,
        module: meta.module.name,
        actions,
        scope: 'all',
      });
  }
  return out;
};

interface AgentLike {
  _id: string;
  agentId: string;
  grantGroupId?: string | null;
}

/**
 * Backing state for the agent Access tab: loads the permission catalog + the
 * agent's current grant group, tracks the selected actions, and persists them
 * by writing the agent's dedicated group (create / adopt / edit) then binding it
 * via mastraAgentUpdate — kept idempotent by the deterministic group name so a
 * retried save never proliferates duplicate groups.
 */
export const useAgentGrant = (agent: AgentLike) => {
  const client = useApolloClient();
  const { hasActionPermission, isOwner } = usePermissionCheck();
  // The group mutations are permissionsManage-gated server-side; mirror that in
  // the UI so a user who can't manage permissions sees a clear disabled state
  // instead of a failing save.
  const canManage = isOwner || hasActionPermission('permissionsManage');

  const { data: modulesData, loading: modulesLoading } = useQuery<{
    permissionModules: PermissionModulesByPlugin[];
  }>(PERMISSION_MODULES);

  const { data: groupData, loading: groupLoading } = useQuery<{
    permissionGroupDetail: {
      _id: string;
      permissions: GroupPermission[];
    } | null;
  }>(PERMISSION_GROUP_DETAIL, {
    variables: { id: agent.grantGroupId },
    skip: !agent.grantGroupId,
  });

  const plugins = useMemo(
    () => modulesData?.permissionModules ?? [],
    [modulesData],
  );

  // Flat module lookup for building the write payload.
  const moduleByKey = useMemo(() => {
    const map = new Map<string, { plugin: string; module: PermissionModule }>();
    for (const p of plugins)
      for (const m of p.modules)
        map.set(keyOf(p.plugin, m.name), { plugin: p.plugin, module: m });
    return map;
  }, [plugins]);

  // enabled modules + explicitly selected (non-always) action names per module.
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [initialSig, setInitialSig] = useState<string>('[]');

  // Seed selection from the agent's current group once the catalog + group are
  // loaded (expand '*' to explicit names against the catalog).
  useEffect(() => {
    if (modulesLoading || groupLoading || !moduleByKey.size) return;
    const perms = groupData?.permissionGroupDetail?.permissions ?? [];
    const nextEnabled = new Set<string>();
    const nextSelected = new Map<string, Set<string>>();

    for (const perm of perms) {
      const k = keyOf(perm.plugin, perm.module);
      const meta = moduleByKey.get(k);
      if (!meta) continue; // stale/unknown module — drop from the picker
      nextEnabled.add(k);
      const allNames = meta.module.actions.map((a) => a.name);
      const alwaysNames = new Set(
        meta.module.actions.filter((a) => a.always).map((a) => a.name),
      );
      const names = perm.actions.includes('*') ? allNames : perm.actions;
      nextSelected.set(k, new Set(names.filter((n) => !alwaysNames.has(n))));
    }

    setEnabled(nextEnabled);
    setSelected(nextSelected);
    setInitialSig(
      signature(buildPermissions(nextEnabled, nextSelected, moduleByKey)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoading, groupLoading, groupData, moduleByKey]);

  const isModuleOn = (plugin: string, module: string) =>
    enabled.has(keyOf(plugin, module));

  const isActionOn = (
    plugin: string,
    module: string,
    action: PermissionAction,
  ) => {
    const k = keyOf(plugin, module);
    if (action.always) return enabled.has(k); // view gates ride along with module
    return selected.get(k)?.has(action.name) ?? false;
  };

  const toggleModule = (plugin: string, module: string, on: boolean) => {
    const k = keyOf(plugin, module);
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(k);
      else next.delete(k);
      return next;
    });
    if (!on)
      setSelected((prev) => {
        const next = new Map(prev);
        next.delete(k);
        return next;
      });
  };

  const toggleAction = (
    plugin: string,
    module: string,
    action: PermissionAction,
    on: boolean,
  ) => {
    if (action.always || action.disabled) return;
    const k = keyOf(plugin, module);
    setEnabled((prev) => (on && !prev.has(k) ? new Set(prev).add(k) : prev));
    setSelected((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(k) ?? []);
      if (on) set.add(action.name);
      else set.delete(action.name);
      next.set(k, set);
      return next;
    });
  };

  const permissions = useMemo(
    () => buildPermissions(enabled, selected, moduleByKey),
    [enabled, selected, moduleByKey],
  );
  const dirty = signature(permissions) !== initialSig;

  const [updateAgent] = useMutation(MASTRA_AGENT_UPDATE);
  const [addGroup] = useMutation(PERMISSION_GROUP_ADD);
  const [editGroup] = useMutation(PERMISSION_GROUP_EDIT);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const name = groupNameFor(agent.agentId);
      let groupId = agent.grantGroupId || undefined;

      // Adopt an existing deterministic group if the agent lost its grantGroupId,
      // so a retry edits the same group instead of proliferating duplicates.
      if (!groupId) {
        const { data } = await client.query<{
          permissionGroups: { _id: string; name: string }[];
        }>({ query: PERMISSION_GROUPS, fetchPolicy: 'network-only' });
        groupId = data?.permissionGroups?.find((g) => g.name === name)?._id;
      }

      if (groupId) {
        await editGroup({ variables: { _id: groupId, name, permissions } });
      } else {
        const res = await addGroup({
          variables: {
            name,
            description: `Auto-managed grant for agent ${agent.agentId}`,
            permissions,
          },
        });
        groupId = res.data?.permissionGroupAdd?._id;
      }

      if (!groupId) throw new Error('Failed to resolve the grant group');

      // Bind the group; the resolver derives the tool filter from it atomically.
      await updateAgent({
        variables: { _id: agent._id, doc: { grantGroupId: groupId } },
        refetchQueries: [{ query: MASTRA_AGENT, variables: { _id: agent._id } }],
        awaitRefetchQueries: true,
      });

      setInitialSig(signature(permissions));
      toast({ title: 'Access saved' });
    } catch (e) {
      toast({
        title: 'Error',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading: modulesLoading || groupLoading,
    canManage,
    plugins,
    isModuleOn,
    isActionOn,
    toggleModule,
    toggleAction,
    dirty,
    saving,
    save,
  };
};

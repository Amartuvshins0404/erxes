import { useMemo, useState } from 'react';
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
      .map((p) => ({ ...p, actions: Array.from(p.actions).sort() }))
      .sort((a, b) =>
        keyOf(a.plugin, a.module).localeCompare(keyOf(b.plugin, b.module)),
      ),
  );

/**
 * Expand the selection map into group permissions. A module is enabled IFF it
 * is a key; its Set holds the chosen non-`always` action names. `always` view
 * gates ride along with any enabled module.
 */
const buildPermissions = (
  selection: Map<string, Set<string>>,
  moduleByKey: Map<string, { plugin: string; module: PermissionModule }>,
): GroupPermission[] => {
  const out: GroupPermission[] = [];
  for (const [k, picked] of selection) {
    const meta = moduleByKey.get(k);
    if (!meta) continue;
    // Explicit names only (never '*') so BOTH the server grant and the derived
    // tool filter resolve concrete actions. View gates ride along automatically.
    const actions = new Set(picked);
    for (const a of meta.module.actions) if (a.always) actions.add(a.name);
    if (actions.size)
      out.push({
        plugin: meta.plugin,
        module: meta.module.name,
        actions: [...actions],
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

  // Single source of truth: a module is enabled IFF it is a key here, and its
  // Set holds the chosen non-`always` action names.
  //
  // Seed derived (not effect-synced) from the agent's current group once the
  // catalog + group are loaded — '*' expands to explicit names against the
  // catalog, `always` names are dropped since they ride along implicitly.
  const seed = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (modulesLoading || groupLoading || !moduleByKey.size) return map;
    const perms = groupData?.permissionGroupDetail?.permissions ?? [];
    for (const perm of perms) {
      const k = keyOf(perm.plugin, perm.module);
      const meta = moduleByKey.get(k);
      if (!meta) continue; // stale/unknown module — drop from the picker
      const allNames: string[] = [];
      const alwaysNames = new Set<string>();
      for (const a of meta.module.actions) {
        allNames.push(a.name);
        if (a.always) alwaysNames.add(a.name);
      }
      const names = perm.actions.includes('*') ? allNames : perm.actions;
      const set = new Set<string>();
      for (const n of names) if (!alwaysNames.has(n)) set.add(n);
      map.set(k, set);
    }
    return map;
  }, [modulesLoading, groupLoading, groupData, moduleByKey]);

  const [selection, setSelection] = useState<Map<string, Set<string>>>(seed);
  const [seededFrom, setSeededFrom] = useState(seed);
  const [initialSig, setInitialSig] = useState(() =>
    signature(buildPermissions(seed, moduleByKey)),
  );

  // Re-seed at render time (the recommended prev-value comparison) whenever the
  // loaded group produces a fresh seed, instead of syncing state in an effect.
  if (seed !== seededFrom) {
    setSeededFrom(seed);
    setSelection(seed);
    setInitialSig(signature(buildPermissions(seed, moduleByKey)));
  }

  const isModuleOn = (plugin: string, module: string) =>
    selection.has(keyOf(plugin, module));

  const isActionOn = (
    plugin: string,
    module: string,
    action: PermissionAction,
  ) => {
    const k = keyOf(plugin, module);
    if (action.always) return selection.has(k); // view gates ride along
    return selection.get(k)?.has(action.name) ?? false;
  };

  // Enabling a module pre-selects ALL its toggleable actions (everything except
  // `always`/`disabled`); the user can un-toggle any afterward.
  const toggleModule = (plugin: string, module: string, on: boolean) => {
    const k = keyOf(plugin, module);
    setSelection((prev) => {
      const next = new Map(prev);
      if (!on) {
        next.delete(k);
        return next;
      }
      const names = new Set<string>();
      const meta = moduleByKey.get(k);
      if (meta)
        for (const a of meta.module.actions)
          if (!a.always && !a.disabled) names.add(a.name);
      next.set(k, names);
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
    setSelection((prev) => {
      // Turning an action OFF on a module that isn't enabled is a no-op — never
      // create an empty Set, which would falsely mark the module enabled.
      if (!on && !prev.has(k)) return prev;
      const next = new Map(prev);
      const set = new Set(next.get(k) ?? []);
      if (on) set.add(action.name);
      else set.delete(action.name);
      next.set(k, set);
      return next;
    });
  };

  const permissions = useMemo(
    () => buildPermissions(selection, moduleByKey),
    [selection, moduleByKey],
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

import { useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { IconRobot } from '@tabler/icons-react';
import { useQuery } from '@apollo/client';
import { ResourceFormLayout } from '~/components/ResourceFormLayout';
import { useResourceForm } from '~/components/useResourceForm';
import { AgentFormFields } from './components/AgentFormFields';
import { useAgent } from './hooks/useAgent';
import {
  useAgentAccess,
  showAgentPermissionError,
  showAgentQuotaError,
} from './hooks/useAgentAccess';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';
import type { IMastraAgentQuotaStatus } from './types';
import { useSaveAgent } from './hooks/useSaveAgent';
import {
  AGENT_FORM_DEFAULTS,
  AgentFormValues,
  agentFormSchema,
} from './validations';
import { toSlug } from './utils';
import { IMastraAgent } from './types';
import { MASTRA_MY_AGENT_QUOTA_STATUS } from '~/graphql/queries';

interface IQuotaStatusResponse {
  mastraMyAgentQuotaStatus: IMastraAgentQuotaStatus;
}

export const AgentFormPage = ({
  embedded = false,
}: { embedded?: boolean } = {}) => {
  const { id } = useParams();
  const isEdit = !!id;
  const basePath = useAgentsBasePath();

  // Auto-fill the slug from the name only for brand-new agents, and only until
  // the user edits the slug by hand. Never derived in render, so a ref (no
  // re-render on change) rather than state. Existing agents keep their id.
  const autoSlug = useRef(!isEdit);

  const { agent } = useAgent(id);
  const { saveAgent, saving } = useSaveAgent(id, agent);
  const { canCreate, canEditAgent, canShare, canShareAgent, isLoaded } =
    useAgentAccess();

  // The server returns an exempt status for create actions with all scope.
  const { data: quotaData, loading: quotaLoading } =
    useQuery<IQuotaStatusResponse>(MASTRA_MY_AGENT_QUOTA_STATUS, {
      skip: isEdit || !canCreate,
    });

  // Toasts are side effects — never call them in the render body.
  // useRef guards prevent duplicate toasts on re-renders before <Navigate> resolves.
  const atQuota =
    !isEdit && !quotaLoading && !!quotaData?.mastraMyAgentQuotaStatus?.atQuota;
  const editBlocked = isEdit && !!agent && !canEditAgent(agent);
  const toastedRef = useRef(false);
  useEffect(() => {
    if (toastedRef.current) return;
    if (atQuota) {
      toastedRef.current = true;
      showAgentQuotaError();
    } else if (editBlocked) {
      toastedRef.current = true;
      showAgentPermissionError();
    }
  }, [atQuota, editBlocked]);

  const form = useResourceForm<AgentFormValues, IMastraAgent>({
    schema: agentFormSchema,
    defaults: AGENT_FORM_DEFAULTS,
    isEdit,
    record: agent,
    load: (agent) => ({
      name: agent.name || '',
      agentId: agent.agentId || '',
      description: agent.description || '',
      instructions: agent.instructions || '',
      provider: agent.provider || '',
      model: agent.model || '',
      destructiveOps: agent.destructiveOps === 'allow' ? 'allow' : 'ask',
      memoryEnabled: agent.memoryEnabled ?? true,
      debug: agent.debug ?? false,
      maxSteps: agent.maxSteps ?? 10,
      temperature: agent.temperature ?? null,
      isEnabled: agent.isEnabled ?? true,
      visibility:
        (agent.visibility as
          | 'private'
          | 'team'
          | 'department'
          | 'unit'
          | 'org') ?? 'private',
      teamId: agent.teamId ?? undefined,
      departmentId: agent.departmentId ?? undefined,
      unitId: agent.unitId ?? undefined,
    }),
  });

  // ── Route guards ────────────────────────────────────────────────────────────
  // Hold all guards until permissions have been fetched to avoid false redirects.
  if (!isLoaded) return null;

  // No create permission (viewer or unassigned) — redirect silently.
  if (!isEdit && !canCreate) {
    return <Navigate to={basePath} replace />;
  }

  // Create page: block if at quota (toast was already fired by useEffect above).
  if (atQuota) {
    return <Navigate to={basePath} replace />;
  }

  // Edit page: block if the user can't edit this specific agent (not owner, not admin).
  if (editBlocked) {
    return <Navigate to={basePath} replace />;
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  // editBlocked redirect above already enforces edit permission, so no
  // per-agent check is needed here — if we got this far, we can save.
  const canSave = isEdit ? true : canCreate;

  const handleNameChange = (value: string) => {
    form.setValue('name', value, { shouldValidate: true });
    if (autoSlug.current) form.setValue('agentId', toSlug(value));
  };

  const onSubmit = (doc: AgentFormValues) => saveAgent(doc);

  const model = form.watch('model');

  return (
    <ResourceFormLayout
      icon={IconRobot}
      title="Agents"
      noun="Agent"
      rootPath={basePath}
      isEdit={isEdit}
      saving={saving}
      saveLabel={isEdit ? 'Save Changes' : 'Create Agent'}
      formId="agent-form"
      submitDisabled={!model || !canSave}
      form={form}
      onSubmit={onSubmit}
      mobileFooter
      embedded={embedded}
    >
      <AgentFormFields
        form={form}
        agentIdEditable={!isEdit}
        canShare={isEdit && agent ? canShareAgent(agent) : canShare}
        onNameChange={handleNameChange}
        onAgentIdChange={() => {
          autoSlug.current = false;
        }}
      />
    </ResourceFormLayout>
  );
};

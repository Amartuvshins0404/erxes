import { useEffect, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { IconRobot } from '@tabler/icons-react';
import { ResourceFormLayout } from '~/components/ResourceFormLayout';
import { useResourceForm } from '~/components/useResourceForm';
import { AgentFormFields } from './components/AgentFormFields';
import { useAgent } from './hooks/useAgent';
import {
  showAgentPermissionError,
  useAgentAccess,
} from './hooks/useAgentAccess';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';
import { useSaveAgent } from './hooks/useSaveAgent';
import {
  AGENT_FORM_DEFAULTS,
  AgentFormValues,
  agentFormSchema,
} from './validations';
import { IMastraAgent } from './types';

export const AgentFormPage = ({
  embedded = false,
}: {
  embedded?: boolean;
} = {}) => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const basePath = useAgentsBasePath();
  const { agent } = useAgent(id);
  const { saveAgent, saving } = useSaveAgent(id);
  const { canCreate, canEditAgent, isLoaded } = useAgentAccess();
  const editBlocked = isEdit && Boolean(agent) && !canEditAgent(agent || {});
  const toastedRef = useRef(false);

  useEffect(() => {
    if (!editBlocked || toastedRef.current) return;
    toastedRef.current = true;
    showAgentPermissionError();
  }, [editBlocked]);

  const form = useResourceForm<AgentFormValues, IMastraAgent>({
    schema: agentFormSchema,
    defaults: AGENT_FORM_DEFAULTS,
    isEdit,
    record: agent,
    load: (record) => ({
      name: record.accountName,
      description: record.accountDescription || '',
      visibility: record.visibility || 'organization',
      audienceUserIds: record.audienceUserIds || [],
      audienceTeamIds: record.audienceTeamIds || [],
      audienceDepartmentIds: record.audienceDepartmentIds || [],
      instructions: record.instructions || '',
      provider: record.provider || '',
      model: record.model || '',
      permissionGroupIds: record.permissionGroupIds,
      additionalTools: record.additionalTools || [],
      destructiveOps: record.destructiveOps === 'allow' ? 'allow' : 'ask',
      memoryEnabled: record.memoryEnabled ?? true,
      debug: record.debug ?? false,
      temperature: record.temperature ?? null,
      isActive: record.isActive,
    }),
  });

  if (!isLoaded) return null;
  if ((!isEdit && !canCreate) || editBlocked) {
    return <Navigate to={basePath} replace />;
  }

  const model = form.watch('model');

  return (
    <ResourceFormLayout
      icon={IconRobot}
      title="AI Team Members"
      noun="AI Team Member"
      rootPath={basePath}
      isEdit={isEdit}
      saving={saving}
      saveLabel={isEdit ? 'Save Changes' : 'Add AI Team Member'}
      formId="agent-form"
      submitDisabled={!model}
      wide
      form={form}
      onSubmit={saveAgent}
      mobileFooter
      embedded={embedded}
    >
      <AgentFormFields form={form} />
    </ResourceFormLayout>
  );
};

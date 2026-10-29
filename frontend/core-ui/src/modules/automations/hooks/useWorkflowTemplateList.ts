import {
  AUTOMATION_WORKFLOW_TEMPLATE_ADD,
  AUTOMATION_WORKFLOW_TEMPLATE_EDIT,
  AUTOMATION_WORKFLOW_TEMPLATE_REMOVE,
} from '@/automations/graphql/automationMutations';
import { AUTOMATION_WORKFLOW_TEMPLATES } from '@/automations/graphql/automationQueries';
import { TWorkflowInputBindings } from '@/automations/utils/workflowInputs';
import { useMutation, useQuery } from '@apollo/client';
import { TAutomationAction } from 'ui-modules';

export type TWorkflowTemplate = {
  _id: string;
  name: string;
  description?: string;
  entryActionId?: string;
  actions: TAutomationAction[];
  inputs?: TWorkflowInputBindings;
  createdAt?: string;
};

export const useWorkflowTemplateList = ({
  searchValue,
}: { searchValue?: string } = {}) => {
  const { data, loading, error, refetch } = useQuery<{
    automationWorkflowTemplates: TWorkflowTemplate[];
  }>(AUTOMATION_WORKFLOW_TEMPLATES, { variables: { searchValue } });

  const [addTemplate, { loading: saving }] = useMutation(
    AUTOMATION_WORKFLOW_TEMPLATE_ADD,
  );
  const [editTemplate, { loading: updatingTemplate }] = useMutation(
    AUTOMATION_WORKFLOW_TEMPLATE_EDIT,
  );
  const [removeTemplateMutation] = useMutation(
    AUTOMATION_WORKFLOW_TEMPLATE_REMOVE,
  );

  const templates = data?.automationWorkflowTemplates || [];

  const removeTemplate = (templateId: string) =>
    removeTemplateMutation({ variables: { _id: templateId } });

  return {
    error,
    refetch,
    templates,
    loading,
    saving,
    updatingTemplate,
    addTemplate,
    editTemplate,
    removeTemplate,
  };
};

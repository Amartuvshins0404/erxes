import { useQuery } from '@apollo/client';
import { Form, RadioGroup, Select } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';
import { FormSection } from '~/components/FormLayout';
import {
  AGENT_FORM_BRANCHES,
  AGENT_FORM_DEPARTMENTS,
  AGENT_FORM_UNITS,
} from '~/graphql/queries';
import { AgentFormValues } from '../validations';

interface INamedItem {
  _id: string;
  title?: string | null;
}

interface IUnit extends INamedItem {
  departmentId?: string | null;
}

export const AgentVisibilitySectionFields = ({
  form,
  step,
}: {
  form: UseFormReturn<AgentFormValues>;
  step: number;
}) => {
  const { t } = useTranslation('mastra');
  const visibility = form.watch('visibility');
  const teamId = form.watch('teamId');
  const departmentId = form.watch('departmentId');

  const isScoped =
    visibility === 'team' ||
    visibility === 'department' ||
    visibility === 'unit';

  const { data: branchData } = useQuery<{ branches: INamedItem[] }>(
    AGENT_FORM_BRANCHES,
    { skip: !isScoped },
  );
  const { data: departmentData } = useQuery<{
    departments: INamedItem[];
  }>(AGENT_FORM_DEPARTMENTS, { skip: !isScoped });
  const { data: unitData } = useQuery<{ units: IUnit[] }>(AGENT_FORM_UNITS, {
    skip: !isScoped,
  });

  const branches = branchData?.branches ?? [];
  const departments = departmentData?.departments ?? [];
  const units = (unitData?.units ?? []).filter(
    (unit) => unit.departmentId === departmentId,
  );

  return (
    <FormSection
      step={step}
      title={t('agent-settings-visibility-title')}
      description={t('agent-settings-visibility-description')}
    >
      <Form.Field
        control={form.control}
        name="visibility"
        render={({ field }) => {
          const selectedScope = isScoped ? 'scoped' : field.value;

          return (
            <Form.Item>
              <Form.Label>
                {t('agent-settings-visibility-label')}
              </Form.Label>
              <Form.Description>
                {t('agent-settings-visibility-help')}
              </Form.Description>
              <Form.Control>
                <RadioGroup
                  value={selectedScope}
                  onValueChange={(value) => {
                    if (value === 'private' || value === 'org') {
                      field.onChange(value);
                      form.setValue('teamId', undefined);
                      form.setValue('departmentId', undefined);
                      form.setValue('unitId', undefined);
                      return;
                    }

                    field.onChange('team');
                    form.setValue('teamId', undefined);
                    form.setValue('departmentId', undefined);
                    form.setValue('unitId', undefined);
                  }}
                  className="grid gap-3 pt-1 md:grid-cols-3"
                >
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedScope === 'private'
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroup.Item value="private" />
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">
                        {t('agent-settings-private')}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('agent-settings-private-description')}
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedScope === 'scoped'
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroup.Item value="scoped" />
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">
                        {t('agent-settings-specific-people')}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('agent-settings-specific-people-description')}
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedScope === 'org'
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroup.Item value="org" />
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">
                        {t('agent-settings-everyone')}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('agent-settings-everyone-description')}
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          );
        }}
      />

      {isScoped && (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">
              {t('agent-settings-audience-title')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('agent-settings-audience-description')}
            </p>
          </div>

          <Form.Field
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t('agent-settings-branch-required')}
                </Form.Label>
                <Select
                  value={field.value ?? ''}
                  onValueChange={(value) => {
                    const branchId = value || undefined;
                    field.onChange(branchId);
                    form.setValue('departmentId', undefined);
                    form.setValue('unitId', undefined);
                    form.setValue('visibility', 'team');
                  }}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value
                        placeholder={t('agent-settings-select-branch')}
                      />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {branches.map((branch) => (
                      <Select.Item key={branch._id} value={branch._id}>
                        {branch.title ?? branch._id}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label className={!teamId ? 'opacity-50' : ''}>
                    {t('agent-settings-department-optional')}
                  </Form.Label>
                  <Select
                    value={field.value ?? ''}
                    disabled={!teamId}
                    onValueChange={(value) => {
                      const selectedDepartmentId = value || undefined;
                      field.onChange(selectedDepartmentId);
                      form.setValue('unitId', undefined);
                      form.setValue(
                        'visibility',
                        selectedDepartmentId ? 'department' : 'team',
                      );
                    }}
                  >
                    <Form.Control>
                      <Select.Trigger>
                        <Select.Value
                          placeholder={
                            teamId
                              ? t('agent-settings-select-department')
                              : t('agent-settings-select-branch-first')
                          }
                        />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      {departments.map((department) => (
                        <Select.Item
                          key={department._id}
                          value={department._id}
                        >
                          {department.title ?? department._id}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label
                    className={!departmentId ? 'opacity-50' : ''}
                  >
                    {t('agent-settings-team-optional')}
                  </Form.Label>
                  <Select
                    value={field.value ?? ''}
                    disabled={!departmentId}
                    onValueChange={(value) => {
                      const unitId = value || undefined;
                      field.onChange(unitId);
                      form.setValue(
                        'visibility',
                        unitId ? 'unit' : 'department',
                      );
                    }}
                  >
                    <Form.Control>
                      <Select.Trigger>
                        <Select.Value
                          placeholder={
                            departmentId
                              ? t('agent-settings-select-team')
                              : t('agent-settings-select-department-first')
                          }
                        />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      {units.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t('agent-settings-no-teams')}
                        </div>
                      ) : (
                        units.map((unit) => (
                          <Select.Item key={unit._id} value={unit._id}>
                            {unit.title ?? unit._id}
                          </Select.Item>
                        ))
                      )}
                    </Select.Content>
                  </Select>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>
        </div>
      )}
    </FormSection>
  );
};

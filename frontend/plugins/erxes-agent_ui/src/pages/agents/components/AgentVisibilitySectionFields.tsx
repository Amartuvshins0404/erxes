import { useQuery } from '@apollo/client';
import { Form, Select } from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import { FormSection } from '~/components/FormLayout';
import { AGENT_FORM_BRANCHES, AGENT_FORM_DEPARTMENTS, AGENT_FORM_UNITS } from '~/graphql/queries';
import { AgentFormValues } from '../validations';

interface INamedItem { _id: string; title?: string | null }
interface IUnit extends INamedItem { departmentId?: string | null }

export const AgentVisibilitySectionFields = ({
  form,
}: {
  form: UseFormReturn<AgentFormValues>;
}) => {
  const visibility   = form.watch('visibility');
  const teamId       = form.watch('teamId');
  const departmentId = form.watch('departmentId');

  const isScoped =
    visibility === 'team' || visibility === 'department' || visibility === 'unit';

  const { data: branchData } = useQuery<{ branches: INamedItem[] }>(
    AGENT_FORM_BRANCHES,
    { skip: !isScoped },
  );
  const { data: deptData } = useQuery<{ departments: INamedItem[] }>(
    AGENT_FORM_DEPARTMENTS,
    { skip: !isScoped },
  );
  const { data: unitData } = useQuery<{ units: IUnit[] }>(
    AGENT_FORM_UNITS,
    { skip: !isScoped },
  );

  const branches    = branchData?.branches ?? [];
  const departments = deptData?.departments ?? [];
  const units = (unitData?.units ?? []).filter((u) => u.departmentId === departmentId);

  return (
    <FormSection
      title="Visibility"
      description="Control who can see and chat with this agent."
    >
      {/* ── Scope type ───────────────────────────────────────────────
          Three modes: Private, Org-wide, or Scoped (cascade).
          Switching to/from Scoped resets all cascade selections.     */}
      <Form.Field
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Access scope</Form.Label>
            <Select
              value={isScoped ? 'scoped' : field.value}
              onValueChange={(v) => {
                if (v === 'private' || v === 'org') {
                  field.onChange(v);
                  form.setValue('teamId', undefined);
                  form.setValue('departmentId', undefined);
                  form.setValue('unitId', undefined);
                } else {
                  // Enter cascade — default to branch-only scope until
                  // the user picks deeper selections below.
                  field.onChange('team');
                  form.setValue('teamId', undefined);
                  form.setValue('departmentId', undefined);
                  form.setValue('unitId', undefined);
                }
              }}
            >
              <Form.Control>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
              </Form.Control>
              <Select.Content>
                <Select.Item value="private">Private — only you</Select.Item>
                <Select.Item value="scoped">Scoped — branch / department / team</Select.Item>
                <Select.Item value="org">Org-wide — everyone</Select.Item>
              </Select.Content>
            </Select>
            <Form.Description>
              Private: only the creator. Scoped: members of the chosen branch, department, or team + the creator. Org-wide: any user with chat access.
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />

      {/* ── Cascade: Branch → Department → Team ─────────────────────
          Each step unlocks the next. The deepest selection sets the
          backend visibility level automatically:
            branch only          → visibility = 'team'
            branch + dept        → visibility = 'department'
            branch + dept + team → visibility = 'unit'              */}
      {isScoped && (
        <>
          {/* Step 1 — Branch (required) */}
          <Form.Field
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  Branch <span className="text-destructive">*</span>
                </Form.Label>
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => {
                    const branchId = v || undefined;
                    field.onChange(branchId);
                    // Changing the branch resets deeper selections and
                    // reverts to branch-only scope.
                    form.setValue('departmentId', undefined);
                    form.setValue('unitId', undefined);
                    form.setValue('visibility', 'team');
                  }}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value placeholder="Select a branch…" />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {branches.map((b) => (
                      <Select.Item key={b._id} value={b._id}>
                        {b.title ?? b._id}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />

          {/* Step 2 — Department (optional, unlocks after branch) */}
          <Form.Field
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label className={!teamId ? 'opacity-50' : ''}>
                  Department
                  <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                </Form.Label>
                <Select
                  value={field.value ?? ''}
                  disabled={!teamId}
                  onValueChange={(v) => {
                    const deptId = v || undefined;
                    field.onChange(deptId);
                    // Changing dept resets the team selection.
                    form.setValue('unitId', undefined);
                    form.setValue('visibility', deptId ? 'department' : 'team');
                  }}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value
                        placeholder={teamId ? 'Select a department…' : 'Select a branch first'}
                      />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {departments.map((d) => (
                      <Select.Item key={d._id} value={d._id}>
                        {d.title ?? d._id}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />

          {/* Step 3 — Team / Unit (optional, unlocks after department,
                      filtered client-side by departmentId) */}
          <Form.Field
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label className={!departmentId ? 'opacity-50' : ''}>
                  Team
                  <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                </Form.Label>
                <Select
                  value={field.value ?? ''}
                  disabled={!departmentId}
                  onValueChange={(v) => {
                    const unitId = v || undefined;
                    field.onChange(unitId);
                    form.setValue('visibility', unitId ? 'unit' : 'department');
                  }}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value
                        placeholder={departmentId ? 'Select a team…' : 'Select a department first'}
                      />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {units.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No teams in this department
                      </div>
                    ) : (
                      units.map((u) => (
                        <Select.Item key={u._id} value={u._id}>
                          {u.title ?? u._id}
                        </Select.Item>
                      ))
                    )}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />
        </>
      )}
    </FormSection>
  );
};

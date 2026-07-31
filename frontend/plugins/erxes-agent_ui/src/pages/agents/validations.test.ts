import {
  AGENT_FORM_DEFAULTS,
  agentFormSchema,
  type AgentFormValues,
} from './validations';

const validForm = (
  overrides: Partial<AgentFormValues> = {},
): AgentFormValues => ({
  ...AGENT_FORM_DEFAULTS,
  name: 'Sales agent',
  instructions: 'Help the sales team.',
  provider: 'provider-1',
  model: 'model-1',
  permissionGroupIds: ['group-1'],
  ...overrides,
});

describe('agentFormSchema', () => {
  it('allows an empty group selection for users with custom permissions', () => {
    const result = agentFormSchema.safeParse(
      validForm({ permissionGroupIds: [] }),
    );

    expect(result.success).toBe(true);
  });

  it('requires at least one target for shared agents', () => {
    const result = agentFormSchema.safeParse(
      validForm({
        visibility: 'shared',
        audienceUserIds: [],
        audienceTeamIds: [],
        audienceDepartmentIds: [],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['visibility'] }),
      );
    }
  });

  it.each([
    ['person', { audienceUserIds: ['user-1'] }],
    ['team', { audienceTeamIds: ['team-1'] }],
    ['department', { audienceDepartmentIds: ['department-1'] }],
  ] as const)(
    'accepts one %s as the complete shared audience',
    (_name, target) => {
      const result = agentFormSchema.safeParse(
        validForm({ visibility: 'shared', ...target }),
      );

      expect(result.success).toBe(true);
    },
  );

  it('accepts a complete agent account configuration', () => {
    const result = agentFormSchema.safeParse(validForm());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissionGroupIds).toEqual(['group-1']);
      expect(result.data).not.toHaveProperty('toolPolicy');
      expect(result.data).not.toHaveProperty('allowedTools');
    }
  });
});

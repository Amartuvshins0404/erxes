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
  it('requires a selected permission group', () => {
    const result = agentFormSchema.safeParse(
      validForm({ permissionGroupIds: [] }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['permissionGroupIds'] }),
      );
    }
  });

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

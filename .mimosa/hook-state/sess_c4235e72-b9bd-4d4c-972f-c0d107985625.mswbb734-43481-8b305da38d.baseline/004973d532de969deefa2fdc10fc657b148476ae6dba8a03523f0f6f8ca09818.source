import { isManagedAssistantAgent } from './isManagedAssistantAgent';

describe('isManagedAssistantAgent', () => {
  it('detects current managed assistants from provisioning metadata', () => {
    expect(
      isManagedAssistantAgent({
        name: 'support-assistant',
        provisioning: {
          stage: 'server_lookup',
        },
      }),
    ).toBe(true);
  });

  it('keeps the legacy managed name prefix as a fallback', () => {
    expect(
      isManagedAssistantAgent({
        name: 'assistant-managed-support',
      }),
    ).toBe(true);
  });

  it('does not classify BYOB approval servers as managed', () => {
    expect(
      isManagedAssistantAgent({
        name: 'support-assistant',
        provisioning: null,
      }),
    ).toBe(false);
  });
});

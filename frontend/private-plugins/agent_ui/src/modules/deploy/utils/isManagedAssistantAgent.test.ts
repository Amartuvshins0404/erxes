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

  it('classifies transferred assistants as managed', () => {
    expect(
      isManagedAssistantAgent({
        name: 'bilguunenkh-aemon',
        provisioning: null,
        transferredAt: '2026-08-24T06:00:00.000Z',
      }),
    ).toBe(true);

    expect(
      isManagedAssistantAgent({
        name: 'bilguunenkh-aemon',
        provisioning: null,
        transferredFromSubdomain: 'bilguunenkh',
      }),
    ).toBe(true);
  });

  it('classifies servers with a managed provider connection as managed', () => {
    expect(
      isManagedAssistantAgent({
        name: 'support-assistant',
        provisioning: null,
        provider: 'moonshot',
      }),
    ).toBe(true);
  });
});

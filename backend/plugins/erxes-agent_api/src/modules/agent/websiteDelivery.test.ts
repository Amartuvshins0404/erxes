import { ensureWebsiteDeliveryReply } from './websiteDelivery';

describe('website delivery evidence', () => {
  it('replaces a false success claim when no website artifact was stored', () => {
    expect(
      ensureWebsiteDeliveryReply({
        reply: 'Done — the website is ready in Preview.',
        publishAttempted: true,
        websiteArtifactCount: 0,
      }),
    ).toContain('not visible in Preview or Files');
  });

  it('emits one concise confirmation after durable website persistence', () => {
    expect(
      ensureWebsiteDeliveryReply({
        reply: 'The website is ready in Preview.',
        publishAttempted: true,
        websiteArtifactCount: 1,
      }),
    ).toBe('The website is ready in Preview and Files.');
  });

  it('does not alter turns that never attempted website publication', () => {
    expect(
      ensureWebsiteDeliveryReply({
        reply: 'Here is the answer.',
        publishAttempted: false,
      }),
    ).toBe('Here is the answer.');
  });
});

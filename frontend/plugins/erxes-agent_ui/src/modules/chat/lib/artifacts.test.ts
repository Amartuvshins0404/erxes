import type { AgentUIMessage } from '~/modules/chat/types';
import type { ArtifactGroup } from '~/modules/chat/hooks/useThreadArtifacts';
import {
  artifactOutcomes,
  associateArtifacts,
  mergeArtifacts,
  websiteBaseUrl,
  websiteNavigationUrl,
  websiteUrl,
  type Artifact,
} from '~/modules/chat/lib/artifacts';
// artifacts.ts pulls REACT_APP_API_URL and card icons for the non-logic
// helpers; stub both so the pure readers under test load under node.
jest.mock('erxes-ui', () => ({ REACT_APP_API_URL: 'http://localhost:4000' }));
jest.mock(
  '@tabler/icons-react',
  () => new Proxy({}, { get: () => () => null }),
);

type MessagePart = AgentUIMessage['parts'][number];

const chart = (id: string): Artifact => ({
  id,
  kind: 'chart',
  title: id,
  spec: { title: id, series: [], data: [] } as never,
});

const document = (id: string, fileName: string): Artifact => ({
  id,
  kind: 'document',
  title: fileName,
  format: fileName.split('.').pop() || 'application/octet-stream',
  fileName,
  mimeType: 'application/octet-stream',
  fileKey: `files/${fileName}`,
});

const renderChartPart = (
  state: string,
  extra: Record<string, unknown> = {},
): MessagePart =>
  ({
    type: 'dynamic-tool',
    toolName: 'renderChart',
    toolCallId: 'call-1',
    state,
    input: { title: 'Sales' },
    ...extra,
  } as unknown as MessagePart);

describe('artifactOutcomes', () => {
  it('reports a settled artifact from a finished tool part', () => {
    const { artifacts, failures } = artifactOutcomes([
      renderChartPart('output-available', {
        output: { artifact: chart('chart_1') },
      }),
    ]);
    expect(artifacts.map((a) => a.id)).toEqual(['chart_1']);
    expect(failures).toHaveLength(0);
  });

  // Regression: a renderChart call whose output chunk was lost (stream aborted
  // mid-tool) used to leave a forever-pending part — no card, no failure, the
  // turn looked like nothing happened. Once the message is settled, a pending
  // artifact tool must surface as a failure.
  it('counts a still-pending artifact tool as a failure once settled', () => {
    const parts = [renderChartPart('input-available')];
    expect(artifactOutcomes(parts, true).failures).toHaveLength(1);
    expect(artifactOutcomes(parts, true).artifacts).toHaveLength(0);
  });

  it('does NOT count a pending artifact tool as a failure while streaming', () => {
    const parts = [renderChartPart('input-available')];
    expect(artifactOutcomes(parts, false).failures).toHaveLength(0);
    expect(artifactOutcomes(parts).failures).toHaveLength(0);
  });

  it('collects every file artifact published by a terminal result', () => {
    const part = {
      type: 'dynamic-tool',
      toolName: 'terminal',
      toolCallId: 'call-terminal',
      state: 'output-available',
      input: { command: 'build' },
      output: {
        artifacts: [
          document('doc_1', 'report.pdf'),
          document('doc_2', 'data.csv'),
        ],
      },
    } as unknown as MessagePart;

    expect(artifactOutcomes([part]).artifacts.map((a) => a.id)).toEqual([
      'doc_1',
      'doc_2',
    ]);
  });
});

describe('mergeArtifacts', () => {
  it('unions live and store, deduped by id, live first', () => {
    const merged = mergeArtifacts([chart('a')], [chart('a'), chart('b')]);
    expect(merged.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('returns live as-is when the store has nothing', () => {
    const live = [chart('a')];
    expect(mergeArtifacts(live, undefined)).toBe(live);
    expect(mergeArtifacts(live, [])).toBe(live);
  });

  // The point of the merge: a store row rescues a bubble whose live/rehydrated
  // tool parts lost the artifact (the old either/or hid it entirely).
  it('fills a live miss from the store', () => {
    expect(mergeArtifacts([], [chart('b')]).map((m) => m.id)).toEqual(['b']);
  });
});

describe('associateArtifacts', () => {
  const messages = (): AgentUIMessage[] => [
    {
      id: 'u1',
      role: 'user',
      parts: [{ type: 'text', text: 'chart of sales' }],
      metadata: { messageId: 'um1' },
    },
    {
      id: 'a1',
      role: 'assistant',
      parts: [],
      metadata: { messageId: 'm1' },
    },
    {
      id: 'u2',
      role: 'user',
      parts: [{ type: 'text', text: 'another chart, by region' }],
      metadata: { messageId: 'um2' },
    },
    {
      id: 'a2',
      role: 'assistant',
      parts: [],
      metadata: { messageId: 'm2' },
    },
  ];

  const group = (over: Partial<ArtifactGroup>): ArtifactGroup => ({
    turnId: 't1',
    prompt: 'another chart, by region',
    items: [chart('chart_2')],
    linked: false,
    ...over,
  });

  it('attaches an unlinked group to its bubble by prompt', () => {
    const result = associateArtifacts(messages(), new Map(), [group({})]);
    expect(result.get('m2')?.map((a) => a.id)).toEqual(['chart_2']);
  });

  // Regression: the backend's assistant-id recovery can stamp an id that never
  // appears in the thread. Such a "linked" group used to be trusted and skipped
  // by the prompt matcher — the chart rendered under no bubble at all.
  it('rescues a group linked to a messageId absent from the thread', () => {
    const result = associateArtifacts(messages(), new Map(), [
      group({ linked: true, messageId: 'ghost-id' }),
    ]);
    expect(result.get('m2')?.map((a) => a.id)).toEqual(['chart_2']);
  });

  it('leaves a correctly linked group to the byMessageId path', () => {
    const byMessageId = new Map([['m2', [chart('chart_2')]]]);
    const result = associateArtifacts(messages(), byMessageId, [
      group({ linked: true, messageId: 'm2' }),
    ]);
    // Present exactly once — the prompt matcher must not double-attach it.
    expect(result.get('m2')?.map((a) => a.id)).toEqual(['chart_2']);
  });
});

describe('websiteUrl', () => {
  it('encodes the capability token and each entry path segment', () => {
    const artifact: Extract<Artifact, { kind: 'website' }> = {
      id: 'site_1',
      kind: 'website',
      title: 'Site',
      entryPath: 'pages/About us?#.html',
      fileCount: 2,
      contentHash: 'a'.repeat(64),
      previewToken: 'token/with ?#',
      fileName: 'About us?#.html',
      mimeType: 'text/html',
      fileKey: 'websites/site_1/pages/About us?#.html',
    };

    expect(websiteUrl(artifact)).toBe(
      'http://localhost:4000/pl:erxes-agent/websites/site_1/token%2Fwith%20%3F%23/pages/About%20us%3F%23.html',
    );
  });
});

describe('websiteNavigationUrl', () => {
  const artifact: Extract<Artifact, { kind: 'website' }> = {
    id: 'site_1',
    kind: 'website',
    title: 'Site',
    entryPath: 'index.html',
    fileCount: 2,
    contentHash: 'a'.repeat(64),
    previewToken: 'token-1',
    fileName: 'index.html',
    mimeType: 'text/html',
    fileKey: 'websites/site_1/index.html',
  };

  it('accepts pages and fragments within the website capability', () => {
    expect(websiteBaseUrl(artifact)).toBe(
      'http://localhost:4000/pl:erxes-agent/websites/site_1/token-1/',
    );
    expect(websiteNavigationUrl(artifact, 'about.html#team')).toBe(
      'http://localhost:4000/pl:erxes-agent/websites/site_1/token-1/about.html#team',
    );
  });

  it.each([
    'https://example.com/about.html',
    'http://localhost:4000/pl:erxes-agent/websites/site_1/other-token/about.html',
    'http://localhost:4000/gateway/graphql',
    'http://[',
  ])('rejects a target outside the website capability: %s', (href) => {
    expect(websiteNavigationUrl(artifact, href)).toBeNull();
  });
});

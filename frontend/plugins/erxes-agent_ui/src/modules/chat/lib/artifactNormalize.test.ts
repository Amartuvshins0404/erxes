import { normalizeArtifact, resolveStorageRef } from './artifactNormalize';

describe('normalizeArtifact', () => {
  // Regression: a pptx document used to render inline but vanish from the Files
  // panel because the panel had its own format whitelist missing 'pptx'. There
  // is now one normalizer with no whitelist, so every format flows through.
  it('keeps a pptx document', () => {
    const a = normalizeArtifact({
      id: 'doc_1',
      kind: 'document',
      format: 'pptx',
      title: 'Deck',
      fileName: 'deck.pptx',
      fileKey: 'key/deck.pptx',
      size: 153040,
    });
    expect(a).toMatchObject({ id: 'doc_1', kind: 'document', format: 'pptx' });
  });

  // The point of the fix: a format the frontend has literally never heard of
  // must still surface, so a new backend document type needs no frontend edit.
  it('keeps a never-before-seen format (dynamic, no whitelist)', () => {
    const a = normalizeArtifact({
      id: 'doc_2',
      kind: 'document',
      format: 'csv',
      fileName: 'rows.csv',
    });
    expect(a?.kind).toBe('document');
    expect(a && a.kind === 'document' && a.format).toBe('csv');
  });

  // The Files panel reads persisted store rows whose id is `artifactId`/`_id`,
  // not `id` — the same normalizer must accept that shape.
  it('reads a persisted store row (artifactId instead of id)', () => {
    const a = normalizeArtifact({
      artifactId: 'doc_3',
      kind: 'document',
      format: 'pdf',
      fileName: 'report.pdf',
    });
    expect(a?.id).toBe('doc_3');
  });

  // pptx decks now carry per-slide image refs + a count; both are optional and
  // non-string slide entries are dropped (permissive, no per-format gate).
  it('reads slides + slideCount on a pptx document', () => {
    const a = normalizeArtifact({
      id: 'deck_1',
      kind: 'document',
      format: 'pptx',
      fileName: 'deck.pptx',
      fileKey: 'key/deck.pptx',
      slides: ['key/s1.png', 'data:image/png;base64,AAA', 7, null, 'http://x/s3.png'],
      slideCount: 3,
    });
    expect(a?.kind).toBe('document');
    expect(a && a.kind === 'document' && a.slides).toEqual([
      'key/s1.png',
      'data:image/png;base64,AAA',
      'http://x/s3.png',
    ]);
    expect(a && a.kind === 'document' && a.slideCount).toBe(3);
  });

  it('leaves slides/slideCount undefined when absent or malformed', () => {
    const a = normalizeArtifact({
      id: 'deck_2',
      kind: 'document',
      format: 'pptx',
      fileName: 'deck.pptx',
      slides: 'not-an-array',
    });
    expect(a && a.kind === 'document' && a.slides).toBeUndefined();
    expect(a && a.kind === 'document' && a.slideCount).toBeUndefined();
  });

  it('normalizes a chart', () => {
    const a = normalizeArtifact({
      id: 'chart_1',
      kind: 'chart',
      title: 'Split',
      spec: { title: 'Split', series: [], data: [] },
    });
    expect(a).toMatchObject({ id: 'chart_1', kind: 'chart', title: 'Split' });
  });

  it('rejects non-objects, missing ids, and unknown kinds', () => {
    expect(normalizeArtifact(null)).toBeNull();
    expect(normalizeArtifact('nope')).toBeNull();
    // no id of any flavour
    expect(normalizeArtifact({ kind: 'document', format: 'pdf' })).toBeNull();
    // unknown kind
    expect(normalizeArtifact({ id: 'x', kind: 'mystery' })).toBeNull();
    // chart without a spec object
    expect(normalizeArtifact({ id: 'c', kind: 'chart' })).toBeNull();
  });
});

describe('resolveStorageRef', () => {
  const API = 'https://api.example.com';

  it('returns data:/http refs unchanged', () => {
    expect(resolveStorageRef('data:image/png;base64,AAA', API)).toBe(
      'data:image/png;base64,AAA',
    );
    expect(resolveStorageRef('https://cdn/x.png', API)).toBe('https://cdn/x.png');
  });

  it('routes a storage key through /read-file (inline)', () => {
    expect(resolveStorageRef('decks/s1.png', API)).toBe(
      'https://api.example.com/read-file?key=decks%2Fs1.png&inline=true',
    );
  });

  it('appends an optional file name', () => {
    expect(resolveStorageRef('k', API, 'deck.pptx')).toContain('&name=deck.pptx');
  });
});

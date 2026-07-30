import { normalizeArtifact } from './artifactNormalize';

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

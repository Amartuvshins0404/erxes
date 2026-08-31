import { splitArtifacts } from '../parseArtifacts';

describe('splitArtifacts', () => {
  it('extracts a complete html artifact with surrounding text', () => {
    const text = [
      'Here is your page:',
      '',
      '```html sales-dashboard',
      '<h1>Hello</h1>',
      '```',
      '',
      'Enjoy!',
    ].join('\n');

    const segments = splitArtifacts(text);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ kind: 'text', text: 'Here is your page:' });
    if (segments[1].kind !== 'artifact') throw new Error('expected artifact');
    expect(segments[1].artifact.type).toBe('html');
    expect(segments[1].artifact.title).toBe('sales-dashboard');
    expect(segments[1].artifact.filename).toBe('sales-dashboard.html');
    expect(segments[1].artifact.content).toBe('<h1>Hello</h1>');
    expect(segments[2]).toEqual({ kind: 'text', text: 'Enjoy!' });
  });

  it('matches artifact languages case-insensitively', () => {
    const segments = splitArtifacts('```HTML\n<p>x</p>\n```');
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('artifact');
  });

  it('keeps an unclosed artifact fence as plain text while streaming', () => {
    const text = 'before\n```xlsx Q3\na,b\n1,2\n';
    const segments = splitArtifacts(text);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('text');
    if (segments[0].kind !== 'text') throw new Error('expected text');
    expect(segments[0].text).toContain('```xlsx');
    expect(segments[0].text).toContain('1,2');
  });

  it('leaves non-allow-listed code fences untouched', () => {
    const text = '```ts\nconst x = 1;\n```\nafter';
    const segments = splitArtifacts(text);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('text');
    if (segments[0].kind !== 'text') throw new Error('expected text');
    expect(segments[0].text).toContain('```ts');
    expect(segments[0].text).toContain('after');
  });

  it('normalizes CRLF line endings', () => {
    const segments = splitArtifacts('```docx Note\r\nHello\r\nWorld\r\n```\r\n');
    expect(segments).toHaveLength(1);
    if (segments[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(segments[0].artifact.content).toBe('Hello\nWorld');
  });

  it('supports tilde fences', () => {
    const segments = splitArtifacts('~~~html\n<p>x</p>\n~~~');
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('artifact');
  });

  it('honors the longer-or-equal closing fence rule', () => {
    const fourOpen = '````html\n```\nnot closed by three\n````\n';
    const segments = splitArtifacts(fourOpen);
    expect(segments).toHaveLength(1);
    if (segments[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(segments[0].artifact.content).toBe('```\nnot closed by three');

    // A tilde line is plain content; with no backtick closer the fence stays open.
    const mismatched = splitArtifacts('```html\n~~~\nnoise\n');
    expect(mismatched).toHaveLength(1);
    expect(mismatched[0].kind).toBe('text');
  });

  it('does not close on a fence line carrying an info string', () => {
    const text = '```html\n<p>a</p>\n```js\nstill inside\n```\n';
    const segments = splitArtifacts(text);
    expect(segments).toHaveLength(1);
    if (segments[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(segments[0].artifact.content).toContain('still inside');
  });

  it('extracts multiple artifacts with interleaved text and ordinals in defaults', () => {
    const text = [
      '```xlsx',
      'a,b',
      '```',
      'middle',
      '```pdf',
      'Doc body',
      '```',
    ].join('\n');

    const segments = splitArtifacts(text);

    expect(segments).toHaveLength(3);
    if (segments[0].kind !== 'artifact' || segments[2].kind !== 'artifact') {
      throw new Error('expected artifacts');
    }
    expect(segments[1]).toEqual({ kind: 'text', text: 'middle' });
    expect(segments[0].artifact.filename).toBe('spreadsheet-1.xlsx');
    expect(segments[2].artifact.filename).toBe('document-1.pdf');
  });

  it('sanitizes titles: quotes stripped, extensions deduped, filename-safe', () => {
    const quoted = splitArtifacts('```xlsx "Q3 Sales"\na,b\n```');
    if (quoted[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(quoted[0].artifact.title).toBe('Q3 Sales');
    expect(quoted[0].artifact.filename).toBe('Q3-Sales.xlsx');

    const withExt = splitArtifacts('```xlsx report.xlsx\na,b\n```');
    if (withExt[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(withExt[0].artifact.filename).toBe('report.xlsx');

    const unsafe = splitArtifacts('```xlsx report: final?\na,b\n```');
    if (unsafe[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(unsafe[0].artifact.filename).toBe('report-final.xlsx');
  });

  it('ignores fences indented inside list items', () => {
    const text = '- item\n    ```html\n    <p>x</p>\n    ```\n';
    const segments = splitArtifacts(text);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('text');
  });

  it('treats a bare closing-style fence as a plain code fence', () => {
    const text = '```\ncode\n```';
    const segments = splitArtifacts(text);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('text');
  });

  it('keeps an empty artifact body as an artifact', () => {
    const segments = splitArtifacts('```html\n```');
    expect(segments).toHaveLength(1);
    if (segments[0].kind !== 'artifact') throw new Error('expected artifact');
    expect(segments[0].artifact.content).toBe('');
  });
});

import { renderPdfDocument } from '../pdf';

// Real @react-pdf renders (font parsing + layout), so allow generous time.
jest.setTimeout(60_000);

const isPdf = (buf: Buffer) => buf.subarray(0, 5).toString('latin1') === '%PDF-';

describe('renderPdfDocument', () => {
  it('renders plain Latin/Cyrillic markdown', async () => {
    const buf = await renderPdfDocument(
      'Тайлан',
      '# Борлуулалтын прогноз\n\nҮр дүн сайжирсан. Өсөлт 12%.',
    );
    expect(isPdf(buf)).toBe(true);
  });

  // Regression: the layout engine resolves the whole font-fallback chain for
  // every text run with that run's style, and the font store matches fontStyle
  // exactly. Before the italic aliases, ANY italic run — even pure Latin —
  // threw "Could not resolve font for Noto Sans SC" because the SC/Arabic/
  // emoji families had no italic source, killing the whole document.
  it('renders italic text without crashing on fallback families', async () => {
    const buf = await renderPdfDocument(
      'Italic regression',
      'Plain, *italic Latin*, *налуу кирилл*, **bold**, ***bold italic***.',
    );
    expect(isPdf(buf)).toBe(true);
  });

  it('renders italic runs containing CJK, Arabic and emoji glyphs', async () => {
    const buf = await renderPdfDocument(
      'Fallback glyph regression',
      '*Прогноз 世界 مرحبا ☀ 2027*',
    );
    expect(isPdf(buf)).toBe(true);
  });
});

import { deriveThreadTitle, sanitizeTitle } from '../titler';

describe('deriveThreadTitle', () => {
  it('uses the first eight words without a provider request', () => {
    expect(
      deriveThreadTitle(
        'Prepare a twelve month sales forecast for erxes Mongolia pipeline',
      ),
    ).toBe('Prepare a twelve month sales forecast for erxes');
  });

  it('skips greetings so the next meaningful message can title the thread', () => {
    expect(deriveThreadTitle('Hello!')).toBeNull();
    expect(deriveThreadTitle('Сайн уу')).toBeNull();
  });

  it('excludes attachment manifests and markdown decoration', () => {
    expect(
      deriveThreadTitle(
        '**Import these contacts**\n\n--- Attached files ---\n1. contacts.xlsx',
      ),
    ).toBe('Import these contacts');
  });
});

describe('sanitizeTitle', () => {
  it('strips wrapping quotes and trailing punctuation', () => {
    expect(sanitizeTitle('"Lead follow-up process."')).toBe(
      'Lead follow-up process',
    );
  });

  it('strips a Title: prefix and keeps only the first line', () => {
    expect(sanitizeTitle('Title: Sales pipeline setup\nExtra commentary')).toBe(
      'Sales pipeline setup',
    );
  });

  it('returns null for empty output', () => {
    expect(sanitizeTitle('   ')).toBeNull();
    expect(sanitizeTitle(null)).toBeNull();
  });

  it('caps overly long titles', () => {
    const title = sanitizeTitle('word '.repeat(30)) ?? '';
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith('…')).toBe(true);
  });
});

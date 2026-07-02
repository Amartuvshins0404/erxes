import { deriveVoiceStatus, partialTail, toolStatusLabel } from './voiceStatus';

describe('toolStatusLabel', () => {
  it('maps known tools to friendly Mongolian labels', () => {
    expect(toolStatusLabel('web-search')).toBe('Вэбээс хайж байна…');
    expect(toolStatusLabel('read-attachment')).toBe('Файл уншиж байна…');
  });

  it('groups every workflow tool under one umbrella line', () => {
    expect(toolStatusLabel('workflow-run-now')).toBe('Урсгал боловсруулж байна…');
    expect(toolStatusLabel('workflow-validate')).toBe('Урсгал боловсруулж байна…');
  });

  it('falls back to a generic label for unknown tools', () => {
    expect(toolStatusLabel('some-future-tool')).toBe('Багаж ашиглаж байна…');
  });
});

describe('partialTail', () => {
  it('returns the cleaned text when short enough', () => {
    expect(partialTail('**Hello** there')).toBe('Hello there');
  });

  it('keeps only the trailing slice, aligned to a word boundary', () => {
    const text = `${'a'.repeat(50)} ${'b'.repeat(200)}`;
    const tail = partialTail(text, 40);
    expect(tail.length).toBeLessThanOrEqual(40);
    expect(tail.startsWith('b')).toBe(true);
  });
});

describe('deriveVoiceStatus', () => {
  it('shows the phase label for the simple phases', () => {
    expect(deriveVoiceStatus({ phase: 'listening' }).label).toBe('Сонсож байна…');
    expect(deriveVoiceStatus({ phase: 'transcribing' }).label).toBe(
      'Бичиж байна…',
    );
  });

  it('surfaces the error text in the error phase', () => {
    expect(deriveVoiceStatus({ phase: 'error', error: 'Mic blocked' })).toEqual({
      label: 'Mic blocked',
    });
  });

  it('uses the active tool label while thinking, with server detail', () => {
    const view = deriveVoiceStatus({
      phase: 'thinking',
      activeToolName: 'web-search',
      serverActivity: 'Searching the web for invoices',
    });
    expect(view.label).toBe('Вэбээс хайж байна…');
    expect(view.detail).toBe('Searching the web for invoices');
  });

  it('falls back to the thinking label when no tool is active', () => {
    const view = deriveVoiceStatus({ phase: 'thinking', serverActivity: '  ' });
    expect(view.label).toBe('Бодож байна…');
    expect(view.detail).toBeUndefined();
  });

  it('reads back the streaming reply while thinking with no tool', () => {
    const view = deriveVoiceStatus({
      phase: 'thinking',
      partialText: 'Захиалгыг шалгаж байна.',
      serverActivity: 'Thinking',
    });
    expect(view.label).toBe('Бодож байна…');
    expect(view.detail).toBe('Захиалгыг шалгаж байна.');
  });

  it('reads back the streamed reply tail while speaking', () => {
    const view = deriveVoiceStatus({
      phase: 'speaking',
      partialText: 'Сайн байна уу.',
    });
    expect(view.label).toBe('Хариулж байна…');
    expect(view.detail).toBe('Сайн байна уу.');
  });
});

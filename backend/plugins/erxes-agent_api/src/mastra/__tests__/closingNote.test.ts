import { closingNoteFor } from '../closingNote';

describe('closingNoteFor', () => {
  it('returns null when the turn needs no closing note', () => {
    expect(
      closingNoteFor({
        interrupted: false,
        failed: false,
        silentAfterWork: false,
      }),
    ).toBeNull();
  });

  it('covers a silent finish after tool work', () => {
    const note = closingNoteFor({
      interrupted: false,
      failed: false,
      silentAfterWork: true,
    });

    expect(note).toBe(
      'I completed the actions but could not put together a reply. Please try again.',
    );
  });

  it('prefers the interrupted note over the others', () => {
    const note = closingNoteFor({
      interrupted: true,
      failed: true,
      silentAfterWork: true,
    });

    expect(note).toContain('interrupted');
  });

  it('prefers the failure note over the silent-finish note', () => {
    const note = closingNoteFor({
      interrupted: false,
      failed: true,
      silentAfterWork: true,
    });

    expect(note).toBe(
      'Something went wrong while I was working on that. Please try again.',
    );
  });
});

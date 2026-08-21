/**
 * Pick the plain-language closing note for a turn that produced no answer
 * text. Returns null when the turn needs no note (it ended normally with an
 * answer, or it is waiting on an ask_user answer).
 *
 * - interrupted: the stream was aborted — partial work may exist, offer retry.
 * - failed: the provider stream errored outright.
 * - silentAfterWork: the model called tools, then ended the turn without
 *   composing any answer and delivered no artifact. From the user's side the
 *   turn simply went silent; the note keeps it from reading as a void.
 */
export const closingNoteFor = (opts: {
  interrupted: boolean;
  failed: boolean;
  silentAfterWork: boolean;
}): string | null =>
  opts.interrupted
    ? 'This response was interrupted before it finished. Please tap retry to continue.'
    : opts.failed
      ? 'Something went wrong while I was working on that. Please try again.'
      : opts.silentAfterWork
        ? 'I completed the actions but could not put together a reply. Please try again.'
        : null;

// Pure helpers for turning a growing assistant reply into speakable sentences.
// The voice playback hook accumulates streamed text deltas and, after each
// delta, pulls any newly-complete sentences out to synthesize them one at a
// time — so speech starts after the first sentence instead of the full reply.

// Sentence-terminal punctuation.
const LATIN_TERMINALS = '.!?…';
const CJK_TERMINALS = '。！？';
const ALL_TERMINALS = LATIN_TERMINALS + CJK_TERMINALS;
// Closing marks that belong to the sentence they trail (quotes / brackets).
const CLOSERS = '"\'”’)]';

const isWhitespace = (ch: string) => /\s/.test(ch);

export interface SentenceSplit {
  sentences: string[];
  rest: string;
}

/**
 * Split `buffer` into complete sentences plus the trailing partial (`rest`).
 *
 * A latin terminal (`. ! ? …`) only ends a sentence when followed by
 * whitespace — so decimals (`3.14`) and the still-streaming last sentence stay
 * in `rest` until more text (or a final flush) arrives. CJK terminals
 * (`。！？`) end a sentence immediately, since CJK text is unspaced.
 */
export function splitSentences(buffer: string): SentenceSplit {
  const sentences: string[] = [];
  const n = buffer.length;
  let start = 0;
  let i = 0;

  while (i < n) {
    const ch = buffer[i];
    const isCjk = CJK_TERMINALS.includes(ch);
    const isLatin = LATIN_TERMINALS.includes(ch);

    if (isLatin || isCjk) {
      // Absorb a run of terminals then any closing quotes/brackets.
      let j = i + 1;
      while (j < n && ALL_TERMINALS.includes(buffer[j])) j++;
      while (j < n && CLOSERS.includes(buffer[j])) j++;

      const latinBoundary = isLatin && j < n && isWhitespace(buffer[j]);
      if (isCjk || latinBoundary) {
        const sentence = buffer.slice(start, j).trim();
        if (sentence) sentences.push(sentence);
        while (j < n && isWhitespace(buffer[j])) j++; // drop the separator
        start = j;
        i = j;
        continue;
      }
    }
    i++;
  }

  return { sentences, rest: buffer.slice(start) };
}

// Strip the markdown a TTS engine would otherwise read aloud (asterisks,
// backticks, heading hashes, list bullets, link syntax). Best-effort and
// conservative — it only removes decoration, never reorders words.
export function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links / images → label
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1') // bold / italic / strike
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s{0,3}[-*+]\s+/gm, '') // bullet markers
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/\s+/g, ' ')
    .trim();
}

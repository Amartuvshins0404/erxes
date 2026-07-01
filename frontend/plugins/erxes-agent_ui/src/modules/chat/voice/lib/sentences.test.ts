import { cleanForSpeech, splitSentences } from './sentences';

describe('splitSentences', () => {
  const cases: Array<{
    name: string;
    input: string;
    sentences: string[];
    rest: string;
  }> = [
    {
      name: 'splits on latin terminals followed by whitespace, keeps the partial',
      input: 'Hello! How are you? I am fine.',
      sentences: ['Hello!', 'How are you?'],
      rest: 'I am fine.',
    },
    {
      name: 'does not split decimals',
      input: 'Pi is 3.14 today. Done',
      sentences: ['Pi is 3.14 today.'],
      rest: 'Done',
    },
    {
      name: 'splits CJK terminals immediately (unspaced)',
      input: '你好。世界！再见',
      sentences: ['你好。', '世界！'],
      rest: '再见',
    },
    {
      name: 'keeps a terminal with no trailing whitespace as the partial',
      input: 'First sentence. Second',
      sentences: ['First sentence.'],
      rest: 'Second',
    },
    {
      name: 'absorbs a closing quote into the sentence',
      input: 'He said "hi." Then left.',
      sentences: ['He said "hi."'],
      rest: 'Then left.',
    },
    {
      name: 'handles ellipsis as a terminal',
      input: 'Wait… really? Yes',
      sentences: ['Wait…', 'really?'],
      rest: 'Yes',
    },
    {
      name: 'collapses a run of terminals',
      input: 'What?! Now',
      sentences: ['What?!'],
      rest: 'Now',
    },
    {
      name: 'empty buffer',
      input: '',
      sentences: [],
      rest: '',
    },
  ];

  it.each(cases)('$name', ({ input, sentences, rest }) => {
    expect(splitSentences(input)).toEqual({ sentences, rest });
  });
});

describe('cleanForSpeech', () => {
  const cases: Array<{ name: string; input: string; expected: string }> = [
    {
      name: 'strips bold and italic',
      input: 'This is **bold** and *italic*.',
      expected: 'This is bold and italic.',
    },
    {
      name: 'strips nested emphasis',
      input: 'Look at **_this_**.',
      expected: 'Look at this.',
    },
    {
      name: 'unwraps inline code',
      input: 'Run `npm test` now.',
      expected: 'Run npm test now.',
    },
    {
      name: 'drops fenced code blocks',
      input: 'Before ```js\nconst x = 1;\n``` after.',
      expected: 'Before after.',
    },
    {
      name: 'reduces links to their label',
      input: 'See [the docs](https://example.com/x) here.',
      expected: 'See the docs here.',
    },
    {
      name: 'strips heading and bullet markers across lines',
      input: '# Title\n- item one\n- item two',
      expected: 'Title item one item two',
    },
  ];

  it.each(cases)('$name', ({ input, expected }) => {
    expect(cleanForSpeech(input)).toBe(expected);
  });
});

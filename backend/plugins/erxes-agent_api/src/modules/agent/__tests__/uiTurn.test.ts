import type { UIMessageChunk } from 'ai';
import { UITurnAccumulator } from '../uiTurn';

const fold = (acc: UITurnAccumulator, ...chunks: UIMessageChunk[]) => {
  chunks.forEach((chunk) => acc.fold(chunk));
};

describe('UITurnAccumulator text blocks', () => {
  it('keeps the final model-step text separate from earlier narration', () => {
    const acc = new UITurnAccumulator();

    fold(
      acc,
      { type: 'text-start', id: 'first' },
      { type: 'text-delta', id: 'first', delta: 'Let me research that.' },
      { type: 'text-end', id: 'first' },
      { type: 'finish-step' },
      { type: 'text-start', id: 'final' },
      { type: 'text-delta', id: 'final', delta: 'The report is ready.' },
      { type: 'text-end', id: 'final' },
    );

    expect(acc.text).toBe('Let me research that.The report is ready.');
    expect(acc.latestText).toBe('The report is ready.');
  });

  it('tracks text-delta chunks even when a provider omits text-start', () => {
    const acc = new UITurnAccumulator();

    fold(
      acc,
      { type: 'text-delta', id: 'final', delta: 'Complete ' },
      { type: 'text-delta', id: 'final', delta: 'answer.' },
      { type: 'text-end', id: 'final' },
    );

    expect(acc.latestText).toBe('Complete answer.');
  });
});

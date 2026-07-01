import {
  normalizeArtifact,
  resolveStorageRef,
} from '../lib/artifactNormalize';
import { applySlideAction, keyToSlideAction } from './slideNav';

describe('keyToSlideAction', () => {
  it('maps next keys', () => {
    for (const k of ['ArrowRight', ' ', 'Spacebar', 'PageDown', 'Enter']) {
      expect(keyToSlideAction(k)).toBe('next');
    }
  });
  it('maps prev keys', () => {
    expect(keyToSlideAction('ArrowLeft')).toBe('prev');
    expect(keyToSlideAction('PageUp')).toBe('prev');
  });
  it('maps first/last', () => {
    expect(keyToSlideAction('Home')).toBe('first');
    expect(keyToSlideAction('End')).toBe('last');
  });
  it('ignores everything else (Esc handled as exit)', () => {
    expect(keyToSlideAction('Escape')).toBe('none');
    expect(keyToSlideAction('a')).toBe('none');
  });
});

describe('applySlideAction', () => {
  it('clamps at both ends', () => {
    expect(applySlideAction(0, 3, 'prev')).toBe(0);
    expect(applySlideAction(2, 3, 'next')).toBe(2);
  });
  it('jumps to first/last', () => {
    expect(applySlideAction(1, 3, 'first')).toBe(0);
    expect(applySlideAction(0, 3, 'last')).toBe(2);
  });
  it('is a no-op with no slides', () => {
    expect(applySlideAction(0, 0, 'next')).toBe(0);
  });
});

// PROOF: a stubbed pptx artifact with 3 slide images drives the same nav logic
// PresentMode uses. We resolve slide URLs the way the component does, then walk
// the deck with the real keyboard map and assert the index/counter track it.
describe('present mode over a stubbed 3-slide deck', () => {
  const artifact = normalizeArtifact({
    id: 'deck_proof',
    kind: 'document',
    format: 'pptx',
    fileName: 'deck.pptx',
    fileKey: 'decks/deck.pptx',
    slides: [
      'data:image/png;base64,S1',
      'decks/slide-2.png',
      'https://cdn.example.com/slide-3.png',
    ],
    slideCount: 3,
  });

  it('resolves each slide ref like fileKey', () => {
    if (!artifact || artifact.kind !== 'document' || !artifact.slides) {
      throw new Error('bad stub');
    }
    const urls = artifact.slides.map((r) => resolveStorageRef(r, 'https://api'));
    expect(urls[0]).toBe('data:image/png;base64,S1');
    expect(urls[1]).toBe('https://api/read-file?key=decks%2Fslide-2.png&inline=true');
    expect(urls[2]).toBe('https://cdn.example.com/slide-3.png');
  });

  it('advances and the counter updates', () => {
    if (!artifact || artifact.kind !== 'document' || !artifact.slides) {
      throw new Error('bad stub');
    }
    const count = artifact.slides.length;
    let i = 0;
    const counter = () => `${i + 1} / ${count}`;
    expect(counter()).toBe('1 / 3');

    i = applySlideAction(i, count, keyToSlideAction('ArrowRight'));
    expect(counter()).toBe('2 / 3');

    i = applySlideAction(i, count, keyToSlideAction(' '));
    expect(counter()).toBe('3 / 3');

    // Past the end clamps.
    i = applySlideAction(i, count, keyToSlideAction('ArrowRight'));
    expect(counter()).toBe('3 / 3');

    i = applySlideAction(i, count, keyToSlideAction('ArrowLeft'));
    expect(counter()).toBe('2 / 3');

    i = applySlideAction(i, count, keyToSlideAction('Home'));
    expect(counter()).toBe('1 / 3');

    i = applySlideAction(i, count, keyToSlideAction('End'));
    expect(counter()).toBe('3 / 3');
  });
});

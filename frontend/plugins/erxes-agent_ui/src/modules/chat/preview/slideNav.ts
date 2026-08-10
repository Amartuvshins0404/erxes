// Pure slide-navigation rules for the pptx present mode — kept free of React and
// the DOM so the keyboard map and index clamping are unit-testable in isolation.
// PresentMode wires these to real key events and fullscreen.

export type SlideNavAction = 'next' | 'prev' | 'first' | 'last' | 'none';

/** Map a KeyboardEvent.key to a deck action (Esc is handled as exit, not here). */
export const keyToSlideAction = (key: string): SlideNavAction => {
  switch (key) {
    case 'ArrowRight':
    case ' ':
    case 'Spacebar':
    case 'PageDown':
    case 'Enter':
      return 'next';
    case 'ArrowLeft':
    case 'PageUp':
      return 'prev';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      return 'none';
  }
};

/** Apply an action to the current index, clamped to [0, count - 1]. */
export const applySlideAction = (
  current: number,
  count: number,
  action: SlideNavAction,
): number => {
  if (count <= 0) return 0;
  const max = count - 1;
  let next = current;
  switch (action) {
    case 'next':
      next = current + 1;
      break;
    case 'prev':
      next = current - 1;
      break;
    case 'first':
      next = 0;
      break;
    case 'last':
      next = max;
      break;
  }
  return Math.min(Math.max(next, 0), max);
};

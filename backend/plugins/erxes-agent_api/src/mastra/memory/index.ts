// ---------------------------------------------------------------------------
// Advanced Memory — façade.
//
// Public surface for the rest of the plugin. State and behavior are delegated
// to focused modules and re-exported.
// ---------------------------------------------------------------------------

export { augmentConvo, deriveResourceId } from './convo';
export {
  readWorkingMemory,
  refreshWorkingMemory,
  buildWorkingMemoryBlock,
  mergeWorkingMemory,
  buildRefreshPrompt,
  buildRefreshUserContent,
  WM_EXTRACTOR_INSTRUCTIONS,
} from './workingMemory';
export type { MemoryContext } from './types';
export type { ConvoMessage } from './convo';

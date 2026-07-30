import { create } from 'zustand';
import type { Artifact } from '~/modules/chat/lib/artifacts';

// Owns the artifact Preview panel (the Claude-artifacts-style side panel): which
// artifact is open, whether it's showing the file list or a single item, and
// whether the panel is visible. Kept separate from chatStore so opening a
// preview never re-renders the chat transport machinery.

type PreviewView = 'item' | 'list';

interface PreviewState {
  open: boolean;
  view: PreviewView;
  artifact: Artifact | null;
  // Whether the panel takes over the whole window (with a file-list sidebar)
  // instead of docking beside the chat.
  fullscreen: boolean;
  // Artifact ids already auto-presented this session — so a live streamed
  // artifact opens the panel once, but hydrated/historical ones never do.
  seen: Set<string>;
  openArtifact: (artifact: Artifact) => void;
  // Open only if this artifact hasn't been auto-presented before (live turns).
  presentIfNew: (artifact: Artifact) => void;
  // Open the panel showing the per-thread file list.
  openList: () => void;
  // Back to the file list from a single item.
  showList: () => void;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
  close: () => void;
}

export const previewStore = create<PreviewState>((set, get) => ({
  open: false,
  view: 'item',
  artifact: null,
  fullscreen: false,
  seen: new Set<string>(),
  openArtifact: (artifact) => {
    const seen = new Set(get().seen);
    if (artifact.id) seen.add(artifact.id);
    set({ open: true, view: 'item', artifact, seen });
  },
  presentIfNew: (artifact) => {
    if (!artifact.id || get().seen.has(artifact.id)) return;
    get().openArtifact(artifact);
  },
  openList: () => set({ open: true, view: 'list' }),
  showList: () => set({ view: 'list' }),
  setFullscreen: (value) => set({ fullscreen: value }),
  toggleFullscreen: () => set({ fullscreen: !get().fullscreen }),
  // Closing always drops fullscreen so the next open starts docked.
  close: () => set({ open: false, fullscreen: false }),
}));

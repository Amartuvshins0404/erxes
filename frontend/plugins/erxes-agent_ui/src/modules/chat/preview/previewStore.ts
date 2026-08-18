import { create } from 'zustand';
import type { Artifact } from '~/modules/chat/lib/artifacts';

// Owns the artifact Preview panel (the Claude-artifacts-style side panel): which
// artifact is open, whether it's showing the file list or a single item, and
// whether the panel is visible. Kept separate from chatStore so opening a
// preview never re-renders the chat transport machinery.

// A tool call snapshotted for the panel's activity view (captured when the
// chat activity line is clicked — the panel does not live-update).
export interface PanelToolCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
  argsText?: string;
  result?: unknown;
  isError?: boolean;
}

// One process step snapshotted for the panel's activity view — the
// serializable subset of the chat's TurnStep (see assistant/turnSteps.ts);
// runningState stays an opaque string so a TurnStep is trivially assignable.
export interface PanelStep {
  id: string;
  status: 'done' | 'active' | 'pending';
  label: string;
  hint?: string;
  note?: string;
  toolCalls: PanelToolCall[];
  runningState?: string;
}

type PreviewView = 'item' | 'list' | 'activity';

interface PreviewState {
  open: boolean;
  view: PreviewView;
  artifact: Artifact | null;
  // The tool-activity snapshot shown when view === 'activity': the turn's full
  // process as titled steps, plus the line's summary as the panel title.
  activity: {
    steps: PanelStep[];
    title?: string;
  } | null;
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
  // Open the panel showing a turn's process as titled steps (reasoning notes,
  // tool calls with full responses), titled by the line's summary.
  openActivity: (input: { steps: PanelStep[]; title?: string }) => void;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
  close: () => void;
}

export const previewStore = create<PreviewState>((set, get) => ({
  open: false,
  view: 'item',
  artifact: null,
  activity: null,
  fullscreen: false,
  seen: new Set<string>(),
  openArtifact: (artifact) => {
    const seen = new Set(get().seen);
    if (artifact.id) seen.add(artifact.id);
    set({ open: true, view: 'item', artifact, activity: null, seen });
  },
  presentIfNew: (artifact) => {
    if (!artifact.id || get().seen.has(artifact.id)) return;
    get().openArtifact(artifact);
  },
  openList: () => set({ open: true, view: 'list', activity: null }),
  showList: () => set({ view: 'list', activity: null }),
  openActivity: (input) =>
    set({ open: true, view: 'activity', activity: input }),
  setFullscreen: (value) => set({ fullscreen: value }),
  toggleFullscreen: () => set({ fullscreen: !get().fullscreen }),
  // Closing always drops fullscreen so the next open starts docked.
  close: () => set({ open: false, fullscreen: false, activity: null }),
}));

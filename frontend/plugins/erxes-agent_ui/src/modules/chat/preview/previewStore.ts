import { create } from 'zustand';
import type { Artifact } from '~/modules/chat/lib/artifacts';

// Owns the artifact Preview panel (the Claude-artifacts-style side panel): which
// artifact is open, whether it's showing the file list or a single item, and
// whether the panel is visible. Kept separate from chatStore so opening a
// preview never re-renders the chat transport machinery.

// A tool call rendered in the panel's activity view (the serializable subset
// of a message's tool-call part).
export interface PanelToolCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
  argsText?: string;
  result?: unknown;
  isError?: boolean;
}

// One process step rendered in the panel's activity view — the serializable
// subset of the chat's TurnStep (see assistant/turnSteps.ts); runningState
// stays an opaque string so a TurnStep is trivially assignable.
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
  // The tool-activity view shown when view === 'activity': the turn's full
  // process as titled steps, plus the line's summary as the panel title. Bound
  // to the turn's message id — while the panel stays open, the bound turn's
  // ToolGroupBlock pushes every step change through syncActivity, so the view
  // live-updates as the turn streams instead of going stale from click time.
  activity: {
    messageId: string;
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
  // tool calls with full responses), titled by the line's summary and bound to
  // the turn's message id so syncActivity keeps it live while the turn runs.
  openActivity: (input: {
    messageId: string;
    steps: PanelStep[];
    title?: string;
  }) => void;
  // Live-update the open activity view from the bound turn's ToolGroupBlock.
  // No-ops unless the panel is open on the activity view for the SAME message,
  // and skips the set when the payload is unchanged (serialized compare — the
  // caller rebuilds step objects every render, so identity alone won't do).
  syncActivity: (input: {
    messageId: string;
    steps: PanelStep[];
    title?: string;
  }) => void;
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
  syncActivity: (input) => {
    const { open, view, activity } = get();
    if (!open || view !== 'activity' || activity?.messageId !== input.messageId) {
      return;
    }
    const unchanged =
      JSON.stringify({ steps: activity.steps, title: activity.title }) ===
      JSON.stringify({ steps: input.steps, title: input.title });
    if (unchanged) return;
    set({ activity: input });
  },
  setFullscreen: (value) => set({ fullscreen: value }),
  toggleFullscreen: () => set({ fullscreen: !get().fullscreen }),
  // Closing always drops fullscreen so the next open starts docked.
  close: () => set({ open: false, fullscreen: false, activity: null }),
}));

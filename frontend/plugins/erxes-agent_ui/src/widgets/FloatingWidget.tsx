import { Sheet } from 'erxes-ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { LAUNCHER_CYCLE } from '@/agents/botCycles';
import { BloubBot } from '@/agents/components/BloubBot';
import { ChatPanel } from '@/agents/components/ChatPanel';
import { ThreadList } from '@/agents/components/ThreadList';
import { useAgentsChat } from '@/agents/hooks/useAgentsChat';
import { useAgentsThreads } from '@/agents/hooks/useAgentsThreads';

/** Launcher button size in px; also drives the clamp math. */
const LAUNCHER_SIZE = 56;
/** Viewport margin the launcher is always kept inside. */
const EDGE_MARGIN = 8;
/** Pointer travel (px) above which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 4;
const POSITION_STORAGE_KEY = 'erxes-agent:launcher-position';

interface ILauncherPosition {
  x: number;
  y: number;
}

const clampToViewport = ({ x, y }: ILauncherPosition): ILauncherPosition => ({
  x: Math.min(
    Math.max(x, EDGE_MARGIN),
    Math.max(EDGE_MARGIN, window.innerWidth - LAUNCHER_SIZE - EDGE_MARGIN),
  ),
  y: Math.min(
    Math.max(y, EDGE_MARGIN),
    Math.max(EDGE_MARGIN, window.innerHeight - LAUNCHER_SIZE - EDGE_MARGIN),
  ),
});

/** Right edge, vertically centered — where the old chevron handle sat. */
const defaultPosition = (): ILauncherPosition => ({
  x: window.innerWidth - LAUNCHER_SIZE - EDGE_MARGIN,
  y: Math.round(window.innerHeight / 2 - LAUNCHER_SIZE / 2),
});

/** Reads the persisted spot; a hand-edited or stale value is ignored. */
const readStoredPosition = (): ILauncherPosition | null => {
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };

    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return null;
    }

    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) {
      return null;
    }

    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
};

/**
 * Global floating agents widget, mounted on every page by the host via
 * `hasFloatingWidget`.
 *
 * The launcher is the bot itself: it plays the calm face montage so it is
 * always alive, and it can be dragged anywhere on screen — while dragging it
 * switches to the `orbit` state (rings spinning around the ball) and its spot
 * is remembered across visits. A press that never moves counts as a click and
 * opens a full-height right side panel with the conversation history and the
 * same chat surface as the full page.
 */
export const FloatingWidget = () => {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<ILauncherPosition>(() =>
    typeof window === 'undefined'
      ? { x: 0, y: 0 }
      : clampToViewport(readStoredPosition() ?? defaultPosition()),
  );

  const chat = useAgentsChat();
  const threadsState = useAgentsThreads();

  /** Pointer offset inside the button when the drag started. */
  const grabRef = useRef({ dx: 0, dy: 0 });
  const pressStartRef = useRef({ x: 0, y: 0 });
  /** True once the pointer passed the drag threshold; suppresses the click. */
  const movedRef = useRef(false);

  // Keep the launcher reachable when the window shrinks under it.
  useEffect(() => {
    const handleResize = () =>
      setPosition((current) => clampToViewport(current));

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const persistPosition = useCallback((next: ILauncherPosition) => {
    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode); the position is not
      // important enough to fail the interaction over.
    }
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    grabRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    pressStartRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;

    // Capture so the drag keeps tracking even when the pointer outruns the
    // button (which is small and moves under the cursor).
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) {
      return;
    }

    const travelled = Math.hypot(
      event.clientX - pressStartRef.current.x,
      event.clientY - pressStartRef.current.y,
    );

    if (travelled > DRAG_THRESHOLD) {
      movedRef.current = true;
    }

    setPosition(
      clampToViewport({
        x: event.clientX - grabRef.current.dx,
        y: event.clientY - grabRef.current.dy,
      }),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) {
      return;
    }

    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (movedRef.current) {
      persistPosition(position);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <Sheet.View
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-4xl"
        >
          <Sheet.Header>
            <Sheet.Title className="flex items-center gap-2 text-base font-semibold">
              <BloubBot size={24} state="idle" />
              Agents
            </Sheet.Title>
            <Sheet.Close aria-label="Close Agents" />
          </Sheet.Header>
          <Sheet.Content className="flex min-h-0 flex-1">
            <aside className="hidden w-60 flex-none border-r md:block">
              <ThreadList
                threadsState={threadsState}
                activeThreadId={chat.threadId}
                onSelectThread={(threadId) => {
                  void chat.openThread(threadId);
                }}
                onNewConversation={() => {
                  chat.startNewConversation();
                }}
                onThreadDeleted={(threadId) => {
                  if (chat.threadId === threadId) {
                    chat.startNewConversation();
                  }
                }}
              />
            </aside>
            <div className="flex min-w-0 flex-1">
              <ChatPanel chat={chat} />
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet>

      {!open && (
        <button
          type="button"
          aria-label="Open Agents (drag to move)"
          title="Open Agents — drag to move"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            // A drag ends with a click event too; swallow that one only.
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }

            setOpen(true);
          }}
          style={{
            left: position.x,
            top: position.y,
            width: LAUNCHER_SIZE,
            height: LAUNCHER_SIZE,
            // Without this, dragging on touch scrolls the page instead.
            touchAction: 'none',
          }}
          className={`fixed z-50 flex items-center justify-center rounded-full border bg-background transition-transform duration-150 ${
            dragging
              ? 'scale-110 cursor-grabbing shadow-xl'
              : 'cursor-grab shadow-lg hover:scale-105'
          }`}
        >
          {dragging ? (
            <BloubBot size={LAUNCHER_SIZE - 4} state="orbit" />
          ) : (
            <BloubBot size={LAUNCHER_SIZE - 4} cycle={LAUNCHER_CYCLE} />
          )}
        </button>
      )}
    </>
  );
};

export default FloatingWidget;

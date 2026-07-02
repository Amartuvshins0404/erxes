import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import { Button, cn } from 'erxes-ui';
import { DocumentArtifact, slideUrls } from '~/modules/chat/lib/artifacts';
import {
  applySlideAction,
  keyToSlideAction,
} from '~/modules/chat/preview/slideNav';

// Google-Slides-style full-screen presenter for a pptx deck. Drives the browser
// Fullscreen API off a click gesture, shows one slide image at a time (contain-
// fit on a black stage), and navigates by keyboard, click zones, or thumbnails.
// All ephemeral UI state is local; the only shared input is the artifact.

const IDLE_MS = 2500;

export const PresentMode = ({
  artifact,
  onExit,
}: {
  artifact: DocumentArtifact;
  onExit: () => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const [index, setIndex] = useState(0);
  const [idle, setIdle] = useState(false);

  const slides = slideUrls(artifact);
  const count = slides.length;

  const go = useCallback(
    (action: Parameters<typeof applySlideAction>[2]) =>
      setIndex((i) => applySlideAction(i, count, action)),
    [count],
  );

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  // Enter real fullscreen on mount (the Present click is the user gesture).
  // Falls back to the fixed overlay if the request is rejected.
  useEffect(() => {
    const el = rootRef.current;
    el?.requestFullscreen?.().catch(() => undefined);
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [wake]);

  // Esc exits; arrows/space/etc. navigate. When in real fullscreen, the browser
  // intercepts Esc to drop fullscreen — fullscreenchange below then exits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      const action = keyToSlideAction(e.key);
      if (action !== 'none') {
        e.preventDefault();
        go(action);
      }
    };
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [go, onExit, wake]);

  const current = slides[index];

  return (
    <div
      ref={rootRef}
      className={cn('ea-present-root', idle && 'is-idle')}
      onMouseMove={wake}
    >
      <div className="ea-present-stage">
        {current && (
          <img
            src={current}
            alt={`Slide ${index + 1}`}
            className="ea-present-slide"
            draggable={false}
          />
        )}
      </div>

      {/* Edge click zones — left = prev, right = next. */}
      <button
        type="button"
        className="ea-present-zone ea-present-zone-prev"
        aria-label="Previous slide"
        onClick={() => go('prev')}
      />
      <button
        type="button"
        className="ea-present-zone ea-present-zone-next"
        aria-label="Next slide"
        onClick={() => go('next')}
      />

      <div className="ea-present-controls">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => go('prev')}
        >
          <IconChevronLeft className="size-5" />
        </Button>
        <span className="ea-present-counter">
          {index + 1} / {count}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next slide"
          disabled={index >= count - 1}
          onClick={() => go('next')}
        >
          <IconChevronRight className="size-5" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Exit present mode"
        className="ea-present-exit"
        onClick={onExit}
      >
        <IconX className="size-5" />
      </Button>

      {count > 1 && (
        <div className="ea-present-thumbs">
          {slides.map((url, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={cn('ea-present-thumb', i === index && 'is-active')}
              onClick={() => setIndex(i)}
            >
              <img src={url} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

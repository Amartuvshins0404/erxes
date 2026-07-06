import { useEffect, useMemo, useState } from 'react';

// Defined locally to avoid MF version-skew: CHART_FONT lives in erxes-ui's
// charts submodule (added 3.0.45) which may not exist on older host shells.
const CHART_FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

type Phase = 'loading' | 'ready' | 'error';

export function sanitizeMermaid(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^﻿/, '')
    .trim()
    .replace(/\[([^\]"[]*[@:/][^\]"[]*)\]/g, '["$1"]');
}

// Colors derived from the erxes design system (oklch-based, converted to hex):
//   Primary:    oklch(0.514 0.2276 276.98) ≈ #6366f1 (indigo-500)
//   Background: oklch(0.2044 0 0)          ≈ #202020 (dark)
//               oklch(1 0 0)               ≈ #ffffff (light)
//   Foreground: oklch(0.2102 0.006 285.87) ≈ #222237 (light mode text)
//               oklch(0.9761 0.0012 286.38)≈ #f7f7f8 (dark mode text)
const themeVars = (dark: boolean) =>
  dark
    ? {
        fontFamily: CHART_FONT, fontSize: '13.5px',
        // ── surfaces ──────────────────────────────────────────────────
        background: '#19191f',   // slightly blue-tinted dark (richer than pure gray)
        mainBkg: '#25253a',      // node fill — distinctly different from bg
        secondaryColor: '#1f1f2e',
        tertiaryColor: '#1a1a28',
        // ── nodes ─────────────────────────────────────────────────────
        primaryColor: '#2d2b57',          // indigo-tinted fill
        primaryBorderColor: '#6366f1',    // bright indigo border  (= erxes primary)
        primaryTextColor: '#eeeef5',      // near-white text
        secondaryBorderColor: '#4a4a70',
        tertiaryBorderColor: '#3f3f60',
        nodeTextColor: '#eeeef5',
        // ── edges & text ──────────────────────────────────────────────
        titleColor: '#f4f4f8',
        lineColor: '#818cf8',             // indigo-400 — softer than primary
        edgeLabelBackground: '#25253a',
        // ── subgraphs / clusters ──────────────────────────────────────
        clusterBkg: '#1d1d2d',
        clusterBorder: '#3d3d60',
        // ── notes ─────────────────────────────────────────────────────
        noteBkgColor: '#1e3560',
        noteTextColor: '#93c5fd',
        noteBorderColor: '#3b82f6',
        // ── sequence diagrams ─────────────────────────────────────────
        actorBkg: '#25253a',
        actorBorder: '#6366f1',
        actorTextColor: '#eeeef5',
        actorLineColor: '#818cf8',
        activationBkgColor: '#2d2b57',
        activationBorderColor: '#818cf8',
        altBackground: '#1f1f2d',
        // ── ER alternating rows ───────────────────────────────────────
        attributeBackgroundColorEven: '#25253a',
        attributeBackgroundColorOdd: '#1f1f2e',
      }
    : {
        fontFamily: CHART_FONT, fontSize: '13.5px',
        // ── surfaces ──────────────────────────────────────────────────
        background: '#ffffff',
        mainBkg: '#fafafa',      // off-white node fill — subtle lift
        secondaryColor: '#f5f3ff',  // violet-50
        tertiaryColor: '#ede9fe',   // violet-100
        // ── nodes ─────────────────────────────────────────────────────
        primaryColor: '#eef2ff',          // indigo-50 — clean, light fill
        primaryBorderColor: '#6366f1',    // indigo-500
        primaryTextColor: '#312e81',      // indigo-900 — dark text on light nodes
        secondaryBorderColor: '#c7d2fe',  // indigo-200
        tertiaryBorderColor: '#ddd6fe',   // violet-200
        nodeTextColor: '#1e1b4b',         // indigo-950
        // ── edges & text ──────────────────────────────────────────────
        titleColor: '#1e1b4b',
        lineColor: '#6366f1',             // indigo arrows
        edgeLabelBackground: '#ffffff',
        // ── subgraphs / clusters ──────────────────────────────────────
        clusterBkg: '#f5f3ff',
        clusterBorder: '#ddd6fe',
        // ── notes ─────────────────────────────────────────────────────
        noteBkgColor: '#fffbeb',   // amber-50
        noteTextColor: '#78350f',  // amber-900
        noteBorderColor: '#fbbf24',
        // ── sequence diagrams ─────────────────────────────────────────
        actorBkg: '#eef2ff',
        actorBorder: '#6366f1',
        actorTextColor: '#312e81',
        actorLineColor: '#6366f1',
        activationBkgColor: '#e0e7ff',  // indigo-100
        activationBorderColor: '#4f46e5',
        altBackground: '#f0f0ff',
        // ── ER alternating rows ───────────────────────────────────────
        attributeBackgroundColorEven: '#ffffff',
        attributeBackgroundColorOdd: '#f5f3ff',
      };

/**
 * Shared hook that compiles a Mermaid definition string to SVG.
 *
 * `debounceMs` (default 0 — render immediately) lets callers in streaming
 * contexts delay the render until the source has stopped changing, preventing
 * a torrent of concurrent Mermaid render calls during token streaming.
 */
export function useMermaidRender(
  definition: string,
  isDark: boolean,
  debounceMs = 0,
) {
  const [state, setState] = useState<{
    phase: Phase;
    svgHtml: string;
    errorMsg: string;
  }>({ phase: 'loading', svgHtml: '', errorMsg: '' });

  const cleaned = useMemo(() => sanitizeMermaid(definition), [definition]);

  const [prevCleaned, setPrevCleaned] = useState(cleaned);
  const [prevDark, setPrevDark] = useState(isDark);
  if (cleaned !== prevCleaned || isDark !== prevDark) {
    setPrevCleaned(cleaned);
    setPrevDark(isDark);
    setState({ phase: 'loading', svgHtml: '', errorMsg: '' });
  }

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    timer = setTimeout(async () => {
      if (cancelled) return;
      const renderId = `mer-${Math.random().toString(36).slice(2)}`;
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: themeVars(isDark),
          // SECURITY: diagram definitions are LLM-authored (prompt-injection →
          // stored XSS), and the rendered SVG is injected via
          // dangerouslySetInnerHTML in PanZoomSvg. 'strict' makes Mermaid
          // HTML-escape labels and disables click/href/script directives, so no
          // active content can survive into the DOM. Pan/zoom node interaction
          // is class-based (PanZoomSvg) and does not need Mermaid's click mode.
          securityLevel: 'strict',
        });
        const renderPromise = mermaid.render(renderId, cleaned);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Mermaid render timed out')), 15_000),
        );
        const { svg } = await Promise.race([renderPromise, timeoutPromise]);
        if (!svg?.trim()) throw new Error('Mermaid returned an empty diagram');
        if (cancelled) return;
        setState({ phase: 'ready', svgHtml: svg, errorMsg: '' });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message.replace(/^Error:\s*/i, '').split('\n')[0]
            : String(err);
        setState({ phase: 'error', svgHtml: '', errorMsg: msg });
      } finally {
        document.getElementById(`d${renderId}`)?.remove();
        document.getElementById(renderId)?.remove();
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleaned, isDark, debounceMs]);

  return { ...state, cleaned };
}

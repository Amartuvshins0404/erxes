import { useState, useEffect } from 'react';
import { useIsDark } from '../../state/themeState';

export const CHART_FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

// Vibrant palette tuned per theme so every colour pops against its background.
const PALETTE_LIGHT = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9',
  '#84cc16', '#a855f7',
];
const PALETTE_DARK = [
  '#818cf8', '#22d3ee', '#34d399', '#fbbf24', '#f87171',
  '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#38bdf8',
  '#a3e635', '#c084fc',
];
export const chartPalette = (isDark?: boolean) => isDark ? PALETTE_DARK : PALETTE_LIGHT;

// Compact number formatter used in chart labels and drilldown table cells.
export const fmtChartValue = (v: number): string =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(1)}k`
  : String(v);

export interface ChartThemeColors {
  foreground: string;
  mutedForeground: string;
  border: string;
  /** Opaque card/popover background — used as tooltip background. */
  surface: string;
  isDark: boolean;
}

// Resolve a CSS custom property to an sRGB color string ECharts can always
// parse. erxes CSS vars use oklch() which Chrome 111+ returns verbatim from
// getComputedStyle but which ECharts' canvas renderer can't parse. We paint a
// 1×1 canvas pixel to force conversion to sRGB.
function resolveCssVar(varName: string): string {
  try {
    const span = document.createElement('span');
    span.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(${varName})`;
    document.body.appendChild(span);
    const raw = getComputedStyle(span).color;
    span.remove();
    if (!raw || raw === 'rgba(0, 0, 0, 0)') return '';
    if (raw.startsWith('rgb(') || raw.startsWith('rgba(')) return raw;
    // oklch, hsl, display-p3, … — paint a canvas pixel to get sRGB.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a > 10 ? `rgb(${r},${g},${b})` : '';
  } catch {
    return '';
  }
}

const DARK_FALLBACK  = { foreground: 'rgb(247,247,248)', mutedForeground: 'rgb(163,163,170)', border: 'rgb(40,40,52)',    surface: 'rgb(25,25,31)'   };
const LIGHT_FALLBACK = { foreground: 'rgb(34,37,55)',    mutedForeground: 'rgb(107,99,98)',   border: 'rgb(226,226,235)', surface: 'rgb(255,255,255)' };

function computeColors(isDark: boolean): ChartThemeColors {
  const fb = isDark ? DARK_FALLBACK : LIGHT_FALLBACK;
  if (typeof document === 'undefined') return { ...fb, isDark };
  return {
    foreground:      resolveCssVar('--foreground')       || fb.foreground,
    mutedForeground: resolveCssVar('--muted-foreground') || fb.mutedForeground,
    border:          resolveCssVar('--border')           || fb.border,
    surface:         resolveCssVar('--background')       || fb.surface,
    isDark,
  };
}

export function useChartColors(isDark: boolean): ChartThemeColors {
  const [colors, setColors] = useState<ChartThemeColors>(() => computeColors(isDark));
  useEffect(() => {
    // ThemeEffect applies the CSS class to <html> in its own useEffect. We can't
    // guarantee which effect fires first (tree order depends on app structure), so
    // we defer to rAF — which runs after all useEffects in the batch — to ensure
    // CSS custom properties reflect the new theme before we read them.
    const id = requestAnimationFrame(() => setColors(computeColors(isDark)));
    return () => cancelAnimationFrame(id);
  }, [isDark]);
  return colors;
}

/** useChartColors bound to the active app theme. */
export function useAppChartColors(): ChartThemeColors {
  const isDark = useIsDark();
  return useChartColors(isDark);
}

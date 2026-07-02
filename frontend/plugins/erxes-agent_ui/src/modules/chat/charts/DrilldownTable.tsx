import { useMemo, useState } from 'react';
import { IconDatabaseOff } from '@tabler/icons-react';
import { CHART_FONT, chartPalette, fmtChartValue } from './chartColors';
import type { ChartThemeColors } from './chartColors';
import type { ChartSpec, DrilldownSpec } from './types';

interface DrilldownTableProps {
  spec: ChartSpec | DrilldownSpec;
  colors: ChartThemeColors;
}

type Column = {
  key: string;
  label: string;
  numeric: boolean;
};

// #rrggbb → rgba() at the given alpha. Falls back to the input for non-hex.
const tint = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// Parse a hex (#rrggbb) or rgb()/rgba() string to an [r,g,b] triple.
const toRgb = (c: string): [number, number, number] | null => {
  const hex = /^#?([0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /rgba?\(([^)]+)\)/.exec(c);
  if (rgb) {
    const p = rgb[1].split(',').map((s) => parseFloat(s));
    if (p.length >= 3) return [p[0], p[1], p[2]];
  }
  return null;
};

// Alpha-composite `fg` over opaque `bg` into a solid rgb() string. Used so the
// sticky header has an OPAQUE accent background — a translucent tint would let
// rows show through as they scroll underneath it.
const blend = (fg: string, bg: string, alpha: number): string => {
  const f = toRgb(fg);
  const b = toRgb(bg);
  if (!f || !b) return bg;
  const mix = f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
};

// Renders a drilldown leaf (individual items — e.g. a list of companies) as a
// premium, scrollable table instead of a one-bar-per-row chart. The first column
// is the category label; each series contributes a right-aligned, accent-colored
// value column. Empty leaves render a styled "No data available" state.
export function DrilldownTable({ spec, colors }: DrilldownTableProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Accent tied to the active chart palette so the table reads as part of the
  // same themed surface as the charts it drills out of.
  const accent = chartPalette(colors.isDark)[0];

  const columns = useMemo<Column[]>(
    () => [
      { key: 'label', label: spec.xAxisLabel || 'Name', numeric: false },
      ...spec.series.map((s) => ({ key: s.key, label: s.label, numeric: true })),
    ],
    [spec.series, spec.xAxisLabel],
  );

  // Opaque so rows never bleed through the sticky header while scrolling.
  const headerBg = blend(accent, colors.surface, colors.isDark ? 0.22 : 0.12);
  const zebraBg = colors.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)';
  const hoverBg = colors.isDark ? tint(accent, 0.22) : tint(accent, 0.12);
  const rowBorder = colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const shadow = colors.isDark
    ? '0 6px 24px rgba(0,0,0,0.45)'
    : '0 6px 20px rgba(0,0,0,0.08)';

  const shell: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    margin: 4,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxShadow: shadow,
    overflow: 'hidden',
    background: colors.surface,
    fontFamily: CHART_FONT,
  };

  // Empty state — a click landed on a point with no sub-data to drill into.
  if (spec.data.length === 0) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: tint(accent, colors.isDark ? 0.16 : 0.1),
            color: accent, marginBottom: 12,
          }}
        >
          <IconDatabaseOff width={22} height={22} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.foreground }}>No data available</div>
        <div style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4, maxWidth: 240 }}>
          There are no further details to show for this selection.
        </div>
      </div>
    );
  }

  const renderCell = (col: Column, row: ChartSpec['data'][number]) => {
    const raw = (row as Record<string, unknown>)[col.key];
    if (!col.numeric) return String(raw ?? '');
    const num = Number(raw);
    return Number.isFinite(num) ? fmtChartValue(num) : '—';
  };

  return (
    <div style={shell}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 13,
            color: colors.foreground,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    textAlign: col.numeric ? 'right' : 'left',
                    padding: '11px 16px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: colors.foreground,
                    background: headerBg,
                    borderBottom: `2px solid ${tint(accent, colors.isDark ? 0.5 : 0.35)}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.data.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                style={{
                  background:
                    hovered === i ? hoverBg : i % 2 === 1 ? zebraBg : 'transparent',
                  transition: 'background 0.13s ease',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.numeric ? 'right' : 'left',
                      padding: '11px 16px',
                      borderBottom: `1px solid ${rowBorder}`,
                      fontWeight: col.numeric ? 700 : 500,
                      fontVariantNumeric: col.numeric ? 'tabular-nums' : 'normal',
                      color: col.numeric ? accent : colors.foreground,
                      maxWidth: col.numeric ? undefined : 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

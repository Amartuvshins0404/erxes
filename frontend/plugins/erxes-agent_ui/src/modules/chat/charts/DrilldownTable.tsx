import { useMemo, useState } from 'react';
import { CHART_FONT, fmtChartValue } from './chartColors';
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

// Renders a drilldown leaf level (individual items — e.g. a list of companies)
// as a compact, scrollable table instead of a one-bar-per-row chart. The first
// column is the category label; each series contributes a right-aligned,
// compactly-formatted value column.
export function DrilldownTable({ spec, colors }: DrilldownTableProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const columns = useMemo<Column[]>(
    () => [
      { key: 'label', label: spec.xAxisLabel || 'Name', numeric: false },
      ...spec.series.map((s) => ({ key: s.key, label: s.label, numeric: true })),
    ],
    [spec.series, spec.xAxisLabel],
  );

  const headBg = colors.surface;
  const rowBorder = colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const hoverBg = colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';

  const renderCell = (col: Column, row: ChartSpec['data'][number]) => {
    const raw = (row as Record<string, unknown>)[col.key];
    if (!col.numeric) return String(raw ?? '');
    const num = Number(raw);
    return Number.isFinite(num) ? fmtChartValue(num) : '—';
  };

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: 8,
        fontFamily: CHART_FONT,
      }}
    >
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
                  padding: '9px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: colors.mutedForeground,
                  background: headBg,
                  borderBottom: `1px solid ${colors.border}`,
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
                background: hovered === i ? hoverBg : 'transparent',
                transition: 'background 0.12s ease',
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.numeric ? 'right' : 'left',
                    padding: '10px 14px',
                    borderBottom: `1px solid ${rowBorder}`,
                    fontWeight: col.numeric ? 600 : 500,
                    fontVariantNumeric: col.numeric ? 'tabular-nums' : 'normal',
                    color: col.numeric ? colors.foreground : colors.foreground,
                    maxWidth: col.numeric ? undefined : 260,
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
  );
}

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsType } from 'echarts';
import { IconChevronLeft } from '@tabler/icons-react';
import { CHART_FONT, useAppChartColors } from '../chartColors';
import { chartSpecToEChartsOption } from '../chartSpecToEChartsOption';
import type { SingleBarRenderHints } from '../chartSpecToEChartsOption';
import type { ChartSpec, DrilldownSpec } from '../types';

export interface EChartHandle {
  downloadPng: (fileName?: string) => void;
}

interface EChartProps {
  spec: ChartSpec;
  className?: string;
  height?: number | string;
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const safeName = (name: string): string =>
  (name || 'chart').replace(/[^\w.-]+/g, '_').slice(0, 80) || 'chart';

// ── Drilldown state machine ───────────────────────────────────────────────────

type DrillState = {
  activeSpec: ChartSpec | DrilldownSpec;
  history: ChartSpec[];
  hiddenLabels: Set<string>;
  // Incremented on RESET/DRILL_IN/DRILL_BACK to force ECharts remount.
  // Intentionally NOT bumped on TOGGLE_LEGEND so legend transitions animate smoothly.
  specKey: number;
};

type DrillAction =
  | { type: 'RESET'; spec: ChartSpec }
  | { type: 'DRILL_IN'; sub: DrilldownSpec }
  | { type: 'DRILL_BACK' }
  | { type: 'TOGGLE_LEGEND'; selected: Record<string, boolean> };

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'RESET':
      return { activeSpec: action.spec, history: [], hiddenLabels: new Set(), specKey: state.specKey + 1 };
    case 'DRILL_IN':
      return {
        activeSpec: action.sub,
        history: [...state.history, state.activeSpec],
        hiddenLabels: new Set(),
        specKey: state.specKey + 1,
      };
    case 'DRILL_BACK': {
      const prev = state.history[state.history.length - 1];
      if (!prev) return state;
      return {
        activeSpec: prev,
        history: state.history.slice(0, -1),
        hiddenLabels: new Set(),
        specKey: state.specKey + 1,
      };
    }
    case 'TOGGLE_LEGEND': {
      const hiddenLabels = new Set(
        Object.entries(action.selected)
          .filter(([, visible]) => !visible)
          .map(([name]) => name),
      );
      return { ...state, hiddenLabels };
    }
  }
}

// ── EChart ────────────────────────────────────────────────────────────────────

export const EChart = forwardRef<EChartHandle, EChartProps>(function EChart(
  { spec, className, height = 360 },
  ref,
) {
  const mounted     = useMounted();
  const instanceRef = useRef<EChartsType | null>(null);
  const colors      = useAppChartColors();
  const bodyRef     = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout>>();

  const [{ activeSpec, history, hiddenLabels, specKey }, dispatch] = useReducer(
    drillReducer,
    undefined,
    () => ({ activeSpec: spec, history: [], hiddenLabels: new Set<string>(), specKey: 0 }),
  );
  const [containerWidth, setContainerWidth] = useState(0);

  // Cancel any pending transition timer on unmount so flushSync never fires on
  // an unmounted tree.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Animate the body panel out, dispatch synchronously, then animate in.
  // expanding=true → drill-in; expanding=false → drill-back
  const animateTransition = useCallback((action: DrillAction, expanding: boolean) => {
    const el = bodyRef.current;
    if (el) {
      el.style.transition = 'opacity 0.13s ease-in, transform 0.13s ease-in';
      el.style.opacity = '0';
      el.style.transform = expanding ? 'scale(0.96) translateY(-5px)' : 'translateY(8px) scale(0.98)';
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flushSync(() => dispatch(action));
      if (el) {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = expanding ? 'translateY(16px) scale(0.97)' : 'scale(1.03) translateY(-5px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition =
              'opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
        });
      }
    }, 130);
  }, []);

  // Track container width so label truncation adapts when the chart is expanded.
  useEffect(() => {
    if (!mounted) return;
    const el = bodyRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.round(entry.contentRect.width));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted]);

  // Reset drilldown state when the top-level spec prop changes.
  useEffect(() => {
    dispatch({ type: 'RESET', spec });
  }, [spec]);

  const isSingleBarSeries = useMemo(() =>
    activeSpec.series.length === 1 &&
    (activeSpec.chartType === 'bar' || activeSpec.chartType === 'horizontalBar') &&
    !activeSpec.stacked,
  [activeSpec]);

  // Remove hidden rows so the chart redraws with no empty slot (gap-free reflow).
  const filteredSpec = useMemo(() => {
    if (!isSingleBarSeries || hiddenLabels.size === 0) return activeSpec;
    return {
      ...activeSpec,
      data: activeSpec.data.filter((row) => !hiddenLabels.has(String(row['label'] ?? ''))),
    };
  }, [activeSpec, hiddenLabels, isSingleBarSeries]);

  const option = useMemo(() => {
    const hints: SingleBarRenderHints | undefined = isSingleBarSeries
      ? { hiddenLabels, allLabels: activeSpec.data.map((r) => String(r['label'] ?? '')) }
      : undefined;
    return chartSpecToEChartsOption(filteredSpec, colors, containerWidth || 360, hints);
  }, [filteredSpec, colors, isSingleBarSeries, hiddenLabels, activeSpec, containerWidth]);

  const handleLegendChange = useCallback(
    (params: { selected: Record<string, boolean> }) => {
      if (!isSingleBarSeries) return;
      dispatch({ type: 'TOGGLE_LEGEND', selected: params.selected });
    },
    [isSingleBarSeries],
  );

  const handleBack = useCallback(() => {
    animateTransition({ type: 'DRILL_BACK' }, false);
  }, [animateTransition]);

  const handleClick = useCallback(
    (params: { name?: string; componentType?: string }) => {
      if (params.componentType !== 'series') return;
      const label = params.name;
      if (!label) return;
      const sub = activeSpec.drilldowns?.[label];
      if (!sub) return;
      animateTransition({ type: 'DRILL_IN', sub }, true);
    },
    [activeSpec, animateTransition],
  );

  useImperativeHandle(
    ref,
    () => ({
      downloadPng: (fileName) => {
        const instance = instanceRef.current;
        if (!instance) return;
        const url = instance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: colors.surface,
        });
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${safeName(fileName || activeSpec.title)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      },
    }),
    [activeSpec.title, colors],
  );

  if (!mounted) {
    return <div className={className} style={{ width: '100%', height, borderRadius: 8 }} aria-hidden />;
  }

  const inDrilldown = history.length > 0;
  const parentTitle = history[history.length - 1]?.title;
  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column' }}>
      {/* Header: chart title at root, or back-button + drilldown title when drilling */}
      {inDrilldown ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px 4px 4px',
            flexShrink: 0,
            borderBottom: `1px solid ${colors.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
            marginBottom: 2,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 500, fontFamily: CHART_FONT,
              color: colors.mutedForeground,
              background: 'none', border: 'none',
              padding: '3px 6px', cursor: 'pointer', borderRadius: 6, flexShrink: 0,
            }}
          >
            <IconChevronLeft width={13} height={13} strokeWidth={2.5} />
            {parentTitle ?? 'Back'}
          </button>
          {activeSpec.title && (
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: CHART_FONT, color: colors.foreground, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {activeSpec.title}
            </span>
          )}
        </div>
      ) : (
        activeSpec.title && (
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: CHART_FONT, color: colors.foreground, lineHeight: 1.35, padding: '8px 16px 6px', flexShrink: 0 }}>
            {activeSpec.title}
          </div>
        )
      )}

      <div
        ref={bodyRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactECharts
            key={specKey}
            option={option}
            notMerge={false}
            lazyUpdate
            className={className}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            opts={{ renderer: 'canvas' }}
            onChartReady={(instance: EChartsType) => { instanceRef.current = instance; }}
            onEvents={{ click: handleClick, legendselectchanged: handleLegendChange }}
          />
        </div>
      </div>
    </div>
  );
});

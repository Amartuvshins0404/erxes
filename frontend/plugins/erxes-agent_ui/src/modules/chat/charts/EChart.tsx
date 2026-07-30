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
import ReactECharts from 'echarts-for-react';
import type { EChartsType } from 'echarts';
import { IconChevronLeft } from '@tabler/icons-react';
import { CHART_FONT, useAppChartColors } from './chartColors';
import type { ChartThemeColors } from './chartColors';
import { chartSpecToEChartsOption } from './chartSpecToEChartsOption';
import type { SingleBarRenderHints } from './chartSpecToEChartsOption';
import { DrilldownTable } from './DrilldownTable';
import type { ChartSpec, DrilldownSpec } from './types';

export interface EChartHandle {
  downloadPng: (fileName?: string) => void;
  /** Window a continuous (value/time) x-axis via ECharts' native dataZoom —
      the external range slider dispatches here instead of slicing rows. */
  dataZoom: (startValue: number, endValue: number) => void;
}

interface EChartProps {
  spec: ChartSpec;
  className?: string;
  height?: number | string;
  /** Skip the built-in top-level title row — for hosts that render the
      artifact title in their own chrome (heading, dialog/panel header).
      The drilldown back-header is unaffected. */
  hideTitle?: boolean;
}

function useMounted(): boolean {
  const [mounted] = useState(() => typeof document !== 'undefined');
  return mounted;
}

const safeName = (name: string): string =>
  (name || 'chart').replace(/[^\w.-]+/g, '_').slice(0, 80) || 'chart';

// A stable structural signature for a spec. While a turn streams, the chat
// transport deep-clones the whole assistant message (and the chart artifact it
// carries) on every throttled tick, so `spec` arrives as a brand-new object that
// is value-identical to the last one. Comparing content — not reference — lets us
// ignore that churn and react only when the chart genuinely changes. A spec is
// plain JSON data, so stringify is a sound, order-stable signature here.
const specSignature = (spec: ChartSpec): string => {
  try {
    return JSON.stringify(spec);
  } catch {
    return '';
  }
};

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
  | { type: 'RESET'; spec: ChartSpec; soft?: boolean }
  | { type: 'DRILL_IN'; sub: DrilldownSpec }
  | { type: 'DRILL_BACK' }
  | { type: 'TOGGLE_LEGEND'; selected: Record<string, boolean> };

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'RESET':
      // A soft reset keeps specKey (no ECharts remount) so the option update
      // animates in place — used when only the data rows changed, e.g. the
      // local filter sliders slicing spec.data continuously during a drag.
      return {
        activeSpec: action.spec,
        history: [],
        hiddenLabels: new Set(),
        specKey: action.soft ? state.specKey : state.specKey + 1,
      };
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
      const hiddenLabels = new Set<string>();
      for (const [name, visible] of Object.entries(action.selected)) {
        if (!visible) hiddenLabels.add(name);
      }
      return { ...state, hiddenLabels };
    }
  }
}

const backButtonStyle = (colors: ChartThemeColors): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: CHART_FONT,
  color: colors.mutedForeground,
  background: 'none',
  border: 'none',
  padding: '3px 6px',
  cursor: 'pointer',
  borderRadius: 6,
  flexShrink: 0,
});

const drilldownTitleStyle = (colors: ChartThemeColors): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: 600,
  fontFamily: CHART_FONT,
  color: colors.foreground,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
});

const chartTitleStyle = (colors: ChartThemeColors): React.CSSProperties => ({
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: CHART_FONT,
  color: colors.foreground,
  lineHeight: 1.35,
  padding: '8px 16px 6px',
  flexShrink: 0,
});

// ── EChart ────────────────────────────────────────────────────────────────────

export const EChart = forwardRef<EChartHandle, EChartProps>(function EChart(
  { spec, className, height = 360, hideTitle },
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

  // Cancel any pending transition timer on unmount so the deferred dispatch
  // never fires on an unmounted tree.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Animate the body panel out, dispatch synchronously, then animate in.
  const animateTransition = useCallback((action: DrillAction, expanding: boolean) => {
    const el = bodyRef.current;
    if (el) {
      el.style.transition = 'opacity 0.13s ease-in, transform 0.13s ease-in';
      el.style.opacity = '0';
      el.style.transform = expanding ? 'scale(0.96) translateY(-5px)' : 'translateY(8px) scale(0.98)';
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dispatch(action);
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

  // Reset the drilldown state machine (and remount ECharts via specKey) only when
  // the chart's *content* changes — not on every new-but-identical `spec` object a
  // streaming turn hands us. Gating on reference here would replay the entry
  // animation ~20×/s the whole time the agent keeps writing after the chart lands.
  const specSig = useMemo(() => specSignature(spec), [spec]);
  const specRef = useRef(spec);
  specRef.current = spec;
  // Snapshot of the drill state for the spec-change effect below, which must
  // choose hard vs soft reset without widening its dep list beyond specSig.
  const drillSnapRef = useRef({ inDrilldown: false, hiddenCount: 0, chartType: spec.chartType, seriesSig: '' });
  drillSnapRef.current = {
    inDrilldown: history.length > 0,
    hiddenCount: hiddenLabels.size,
    chartType: activeSpec.chartType,
    seriesSig: JSON.stringify(activeSpec.series),
  };
  const appliedSigRef = useRef(specSig);
  useEffect(() => {
    // Skip both the mount run (the reducer already initialized to this spec) and
    // pure reference churn; act only on a real content change.
    if (appliedSigRef.current === specSig) return;
    appliedSigRef.current = specSig;
    const next = specRef.current;
    // Same chart type + series, no drilldown open, no legend-hidden labels →
    // only the rows changed (the local filter sliders slicing spec.data), so
    // update the mounted instance in place and let ECharts animate the data
    // transition instead of remounting the canvas on every slider tick. Any
    // shape change keeps the hard remount (and its entry animation).
    // Row-driven series changes (single-bar charts expand to one option-series
    // per row label) are safe here because updates go through setOption with
    // replaceMerge: ['series'] below — stale series are REMOVED with an exit
    // animation, and survivors (matched by stable id) slide to their new slot.
    const snap = drillSnapRef.current;
    const soft =
      !snap.inDrilldown &&
      snap.hiddenCount === 0 &&
      next.chartType === snap.chartType &&
      JSON.stringify(next.series) === snap.seriesSig;
    dispatch({ type: 'RESET', spec: next, soft });
  }, [specSig]);

  const isSingleBarSeries = useMemo(() =>
    activeSpec.series.length === 1 &&
    (activeSpec.chartType === 'bar' || activeSpec.chartType === 'horizontalBar') &&
    !activeSpec.stacked,
  [activeSpec]);

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

  // Option updates are applied imperatively, NOT through ReactECharts' own
  // componentDidUpdate (shouldSetOption below always returns false). Reason:
  // smooth collapse needs merge semantics (notMerge: false, so ECharts diffs
  // old vs new data and animates bars/lines sliding together) PLUS
  // replaceMerge: ['series'] so series absent from the new option are removed
  // with an exit animation instead of lingering — echarts-for-react cannot
  // pass replaceMerge. The axis category array and the series data both derive
  // from the same filtered spec, so they stay in exact sync by construction.
  const appliedOptionRef = useRef(option);
  useEffect(() => {
    if (option === appliedOptionRef.current) return;
    appliedOptionRef.current = option;
    const instance = instanceRef.current;
    if (!instance || instance.isDisposed()) return;
    instance.setOption(option as Parameters<EChartsType['setOption']>[0], {
      notMerge: false,
      replaceMerge: ['series'],
      lazyUpdate: true,
    });
  }, [option]);

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
      // Every data point is drillable — bars, single-bar series, and pie/donut
      // slices all reach here. We never bail on a missing sub-spec; a point with
      // no sub-data drills into an empty-state table instead of ignoring the click.
      if (params.componentType !== 'series') return;
      const label = params.name;
      if (!label) return;
      const sub: DrilldownSpec = (activeSpec as ChartSpec).drilldowns?.[label] ?? {
        chartType: 'bar',
        title: label,
        series: activeSpec.series.length
          ? [activeSpec.series[0]]
          : [{ key: 'value', label: 'Value' }],
        data: [],
      };
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
      dataZoom: (startValue, endValue) => {
        const instance = instanceRef.current;
        if (!instance || instance.isDisposed()) return;
        // Rides the native, highly-optimized zoom animation — the option's
        // hidden 'inside' dataZoom component is the dispatch target.
        instance.dispatchAction({ type: 'dataZoom', startValue, endValue });
      },
    }),
    [activeSpec.title, colors],
  );

  if (!mounted) {
    return <div className={className} style={{ width: '100%', height, borderRadius: 8 }} aria-hidden />;
  }

  const inDrilldown = history.length > 0;
  const parentTitle = history[history.length - 1]?.title;

  // Drilling into any data point lists its individual items, which read far
  // better as a table than a chart. Every drilldown level therefore renders as
  // a table (empty levels show a "No data available" state); the top-level
  // parent keeps its chart.
  const showTable = inDrilldown;
  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column' }}>
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
          <button type="button" onClick={handleBack} style={backButtonStyle(colors)}>
            <IconChevronLeft width={13} height={13} strokeWidth={2.5} />
            {parentTitle ?? 'Back'}
          </button>
          {activeSpec.title && (
            <span style={drilldownTitleStyle(colors)}>
              {activeSpec.title}
            </span>
          )}
        </div>
      ) : (
        activeSpec.title && !hideTitle && (
          <div style={chartTitleStyle(colors)}>
            {activeSpec.title}
          </div>
        )
      )}

      <div
        ref={bodyRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          {showTable ? (
            <DrilldownTable spec={activeSpec} colors={colors} />
          ) : (
            <ReactECharts
              key={specKey}
              option={option}
              // All post-mount option updates go through the imperative
              // setOption effect above (merge + replaceMerge:['series']);
              // ReactECharts only paints the mount-time option, so its own
              // update props (notMerge/lazyUpdate) would be inert here.
              shouldSetOption={() => false}
              className={className}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
              opts={{ renderer: 'canvas' }}
              onChartReady={(instance: EChartsType) => {
                instanceRef.current = instance;
                // The fresh instance was initialized with the current option —
                // record it so the update effect doesn't re-apply it.
                appliedOptionRef.current = option;
              }}
              onEvents={{ click: handleClick, legendselectchanged: handleLegendChange }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

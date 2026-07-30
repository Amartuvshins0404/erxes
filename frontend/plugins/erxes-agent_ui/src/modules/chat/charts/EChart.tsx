import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsType } from 'echarts';
import { chartSpecToEChartsOption } from './chartSpecToEChartsOption';
import type { ChartSpec } from './types';

// Plugin-local copy of erxes-ui's EChart — see ./README-WHY-LOCAL.md. Imports
// `echarts-for-react`/`echarts` directly (they are NOT shared in
// module-federation.config, so they bundle INTO this plugin) instead of relying
// on the host's shared `erxes-ui` exporting `EChart`. This is what makes charts
// render regardless of the host `core_ui` version.
//
// Interactive ECharts renderer for a ChartSpec — the "advanced" chart surface
// shown in the agent Preview panel and for inline chart-viz blocks. ECharts
// touches window at render time, so we defer to the client (mount guard).

// Imperative handle so a parent (e.g. the Preview panel header) can export the
// live chart canvas as a PNG.
export interface EChartHandle {
  downloadPng: (fileName?: string) => void;
}

interface EChartProps {
  spec: ChartSpec;
  className?: string;
  height?: number | string;
}

// Local mount guard — defers the first render to the client so ECharts never
// touches `window` during SSR / hydration.
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const safeName = (name: string): string =>
  (name || 'chart').replace(/[^\w.-]+/g, '_').slice(0, 80) || 'chart';

export const EChart = forwardRef<EChartHandle, EChartProps>(function EChart(
  { spec, className, height = 360 },
  ref,
) {
  const mounted = useMounted();
  const instanceRef = useRef<EChartsType | null>(null);
  const option = useMemo(() => chartSpecToEChartsOption(spec), [spec]);

  useImperativeHandle(
    ref,
    () => ({
      downloadPng: (fileName) => {
        const instance = instanceRef.current;
        if (!instance) return;
        // Canvas renderer → getDataURL produces a real PNG (matches the view).
        const url = instance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${safeName(fileName || spec.title)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      },
    }),
    [spec.title],
  );

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ width: '100%', height, borderRadius: 8 }}
        aria-hidden
      />
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      className={className}
      style={{ width: '100%', height }}
      opts={{ renderer: 'canvas' }}
      onChartReady={(instance: EChartsType) => {
        instanceRef.current = instance;
      }}
    />
  );
});

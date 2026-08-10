import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { IconDownload, IconX } from '@tabler/icons-react';
import { Button, cn, Dialog, Slider, Switch } from 'erxes-ui';
import { EChart, fmtChartValue, type EChartHandle } from '~/modules/chat/charts';
import type { ChartArtifact } from '~/modules/chat/lib/artifacts';
import { hasContinuousXAxis, rowLabel } from '~/modules/chat/lib/chartControls';
import { chartTotals } from '~/modules/chat/lib/chartTotals';
import {
  useChartControls,
  type ChartControlItem,
} from '~/modules/chat/hooks/useChartControls';

// The one compact-number formatter for chips and totals — the same scheme the
// chart's own labels use, rounded so float slider steps don't print epsilon
// tails.
const fmtCompact = (v: number): string =>
  fmtChartValue(Math.round(v * 100) / 100);

const THUMB_CLASS =
  'block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

// Dual-thumb window slider. erxes-ui's Slider hardcodes a single thumb, so this
// renders the same radix primitive with two — using the exact class strings the
// shared slider ships, which keeps them in the host CSS through the production
// purge (same rule as .ea-preview-dock in chat.css).
const RangeSlider = (
  props: ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
) => (
  <SliderPrimitive.Root
    className="relative flex w-full touch-none select-none items-center"
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={THUMB_CLASS} aria-label="Range start" />
    <SliderPrimitive.Thumb className={THUMB_CLASS} aria-label="Range end" />
  </SliderPrimitive.Root>
);

const ControlLabel = ({ label }: { label: string }) => (
  // Fixed label width as an inline style — w-28/max-w-* utilities are
  // plugin-unique here and would be purged from the production host CSS.
  <span
    className="shrink-0 truncate text-sm text-foreground"
    style={{ width: '9rem' }}
    title={label}
  >
    {label}
  </span>
);

const ValueChip = ({ value }: { value: string }) => (
  <span
    className="shrink-0 truncate rounded-lg bg-muted px-3 py-2 text-sm font-medium"
    style={{ maxWidth: '9rem', fontVariantNumeric: 'tabular-nums' }}
    title={value}
  >
    {value}
  </span>
);

// One AI-declared control → the matching UI element. ChartControlItem is a
// discriminated union, so every branch reads `item.value` at its real type.
const ChartControlRow = ({
  item,
  artifact,
}: {
  item: ChartControlItem;
  artifact: ChartArtifact;
}) => {
  if (item.type === 'toggle') {
    return (
      <div className="flex items-center gap-3">
        <ControlLabel label={item.label} />
        <div className="min-w-0 flex-1" />
        <Switch
          checked={item.value}
          onCheckedChange={(on) => item.setValue(on)}
          aria-label={item.label}
        />
      </div>
    );
  }

  if (item.type === 'range') {
    const [start, end] = item.value;
    const chip = `${rowLabel(artifact.spec.data[start]) || start + 1} – ${
      rowLabel(artifact.spec.data[end]) || end + 1
    }`;
    return (
      <div className="flex items-center gap-3">
        <ControlLabel label={item.label} />
        <div className="min-w-0 flex-1">
          <RangeSlider
            min={item.min}
            max={item.max}
            step={item.step}
            value={item.value}
            onValueChange={([a, b]) => item.setValue([a, b])}
            aria-label={item.label}
          />
        </div>
        <ValueChip value={chip} />
      </div>
    );
  }

  // slider / param — same UI, different application (threshold vs formula var).
  return (
    <div className="flex items-center gap-3">
      <ControlLabel label={item.label} />
      <div className="min-w-0 flex-1">
        <Slider
          min={item.min}
          max={item.max}
          step={item.step}
          value={[item.value]}
          onValueChange={([v]) => item.setValue(v)}
          aria-label={item.label}
        />
      </div>
      <ValueChip value={fmtCompact(item.value)} />
    </div>
  );
};

// ── The adaptive chart view: EChart + totals + AI-declared controls ──────────
// Every surface that shows a chart artifact renders this one component, so the
// chart and its controls stay in lockstep everywhere. Controls are whatever
// the agent declared in spec.controls: none → just the chart (its interactive
// legend, tooltips and drilldowns still work); some → the matching sliders/
// toggles mount below the plot and filter the delivered data locally via
// useChartControls — no new AI prompt, values shared across all views.
export const ChartArtifactView = forwardRef<
  EChartHandle,
  {
    artifact: ChartArtifact;
    className?: string;
    /** Fixed plot height (inline chat flow). Omit to fill the parent
        (expand dialog, Preview panel). */
    chartHeight?: number | string;
  }
>(function ChartArtifactView({ artifact, className, chartHeight }, ref) {
  const spec = artifact.spec;
  const { filteredSpec, controls, isFiltered, reset, totalRows, shownRows } =
    useChartControls(artifact);

  // Internal handle (also exposed to parents for PNG download): needed locally
  // to drive the native dataZoom below. The forwarded handle delegates at CALL
  // time — chartRef.current is still null while this handle is being created.
  const chartRef = useRef<EChartHandle>(null);
  useImperativeHandle(
    ref,
    () => ({
      downloadPng: (fileName) => chartRef.current?.downloadPng(fileName),
      dataZoom: (startValue, endValue) =>
        chartRef.current?.dataZoom(startValue, endValue),
    }),
    [],
  );

  // Continuous value x-axis: the range slider windows the axis via ECharts'
  // own dataZoom action — native zoom animation, rows untouched — instead of
  // slicing the data array like the category charts do.
  const rangeItem = controls.find(
    (c): c is Extract<ChartControlItem, { type: 'range' }> => c.type === 'range',
  );
  const continuous = hasContinuousXAxis(spec);
  const [rangeStart, rangeEnd] = rangeItem?.value ?? [-1, -1];
  useEffect(() => {
    if (!continuous || rangeStart < 0) return;
    const xOf = (i: number) => {
      const n = Number(spec.data[i]?.['label']);
      return Number.isFinite(n) ? n : i;
    };
    chartRef.current?.dataZoom(xOf(rangeStart), xOf(rangeEnd));
  }, [continuous, rangeStart, rangeEnd, spec]);

  const totals = useMemo(
    () => chartTotals(spec, filteredSpec),
    [spec, filteredSpec],
  );

  const fill = chartHeight == null;
  return (
    <div className={cn('flex flex-col', fill && 'h-full min-h-0', className)}>
      <div
        className={fill ? 'min-h-0 flex-1' : 'shrink-0'}
        style={fill ? undefined : { height: chartHeight }}
      >
        <EChart ref={chartRef} spec={filteredSpec} height="100%" hideTitle />
      </div>

      {/* Headline totals — hairline-separated stat tiles. */}
      {totals.length > 0 && (
        <div className="flex shrink-0 items-start justify-around gap-2 border-t border-border/50 px-3 py-3">
          {totals.map((t) => (
            <div key={t.label} className="min-w-0 text-center">
              <p className="truncate text-sm text-muted-foreground" title={t.label}>
                {t.label}
              </p>
              <p
                className="truncate text-base font-semibold"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmtCompact(t.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Control panel — only when the AI declared controls for this chart. */}
      {controls.length > 0 && (
        <div className="shrink-0 space-y-3 border-t border-border/50 px-3 py-3">
          {controls.map((item) => (
            <ChartControlRow key={item.id} item={item} artifact={artifact} />
          ))}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isFiltered && shownRows !== totalRows
                ? `Showing ${shownRows} of ${totalRows} points`
                : `${totalRows} points`}
            </p>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Expanded (modal) view ─────────────────────────────────────────────────────
// A large portal overlay with the exact same ChartArtifactView — same store
// key, so both the chart AND its conditionally rendered controls carry over,
// with slider positions synced live between inline and expanded views.
export const ChartExpandDialog = ({
  artifact,
  open,
  onOpenChange,
}: {
  artifact: ChartArtifact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const chartRef = useRef<EChartHandle>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sized inline, not via w-[92vw]-style utilities — those are plugin-
          unique arbitrary values the production CSS purge would drop. */}
      <Dialog.Content
        className="flex flex-col gap-0 p-0"
        style={{ width: '92vw', maxWidth: '92vw', height: '86vh' }}
      >
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
          <Dialog.Title className="min-w-0 flex-1 truncate text-sm font-medium">
            {artifact.title}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Expanded interactive chart view
          </Dialog.Description>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => chartRef.current?.downloadPng(artifact.title)}
          >
            <IconDownload className="size-3.5" />
            PNG
          </Button>
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <IconX className="size-4" />
            </Button>
          </Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 p-3">
          <ChartArtifactView ref={chartRef} artifact={artifact} />
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

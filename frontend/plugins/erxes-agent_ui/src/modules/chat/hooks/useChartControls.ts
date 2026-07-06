import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import type { ChartSpec } from '~/modules/chat/charts';
import type { ChartArtifact } from '~/modules/chat/lib/artifacts';
import {
  applyChartControls,
  clampControlValue,
  resolveChartControls,
  type ChartControlValue,
  type NumberControl,
  type RangeControl,
  type ToggleControl,
} from '~/modules/chat/lib/chartControls';

// ── Shared per-artifact control values ────────────────────────────────────────
// Keyed by artifact id, then control id, and read by every view of the same
// chart — the inline chat card, the expand dialog, and the Preview panel — so
// a slider moved in one view is already applied when the chart opens anywhere
// else. Session-scoped on purpose: control positions are a reading aid, not
// artifact content.
interface ChartControlsState {
  values: Record<string, Record<string, ChartControlValue>>;
  setValue: (
    artifactId: string,
    controlId: string,
    value: ChartControlValue,
  ) => void;
  reset: (artifactId: string) => void;
}

const chartControlsStore = create<ChartControlsState>((set) => ({
  values: {},
  setValue: (artifactId, controlId, value) =>
    set((s) => ({
      values: {
        ...s.values,
        [artifactId]: { ...s.values[artifactId], [controlId]: value },
      },
    })),
  reset: (artifactId) =>
    set((s) => {
      const { [artifactId]: _removed, ...rest } = s.values;
      return { values: rest };
    }),
}));

/** A resolved control plus its live value and setter, typed per branch so
    render code never casts. */
export type ChartControlItem =
  | (RangeControl & {
      value: [number, number];
      setValue: (value: [number, number]) => void;
    })
  | (NumberControl & { value: number; setValue: (value: number) => void })
  | (ToggleControl & { value: boolean; setValue: (value: boolean) => void });

export interface ChartControlsApi {
  /** The spec narrowed by the current control values — feed this to EChart. */
  filteredSpec: ChartSpec;
  /** Mountable controls ([] → render the bare chart, no control panel). */
  controls: ChartControlItem[];
  /** True when any control differs from its default. */
  isFiltered: boolean;
  reset: () => void;
  totalRows: number;
  shownRows: number;
}

/**
 * The visualizer's local state manager. Resolves the AI-declared
 * `spec.controls` against the data, exposes each control's live value, and
 * applies value changes as purely local filters — moving a slider narrows the
 * already-delivered data and re-renders the chart instantly; it never sends a
 * new prompt to the AI.
 */
export function useChartControls(artifact: ChartArtifact): ChartControlsApi {
  const spec = artifact.spec;
  const stored = chartControlsStore((s) => s.values[artifact.id]);
  const setValue = chartControlsStore((s) => s.setValue);
  const resetStore = chartControlsStore((s) => s.reset);

  const resolved = useMemo(() => resolveChartControls(spec), [spec]);

  const filteredSpec = useMemo(
    () => applyChartControls(spec, resolved, stored),
    [spec, resolved, stored],
  );

  const controls = useMemo<ChartControlItem[]>(
    () =>
      resolved.map((rc): ChartControlItem => {
        const set = (value: ChartControlValue) =>
          setValue(artifact.id, rc.id, value);
        // The switch exists so each branch pairs the control with its own
        // value type — clampControlValue's overloads do the narrowing.
        switch (rc.type) {
          case 'range':
            return { ...rc, value: clampControlValue(rc, stored?.[rc.id]), setValue: set };
          case 'toggle':
            return { ...rc, value: clampControlValue(rc, stored?.[rc.id]), setValue: set };
          default:
            return { ...rc, value: clampControlValue(rc, stored?.[rc.id]), setValue: set };
        }
      }),
    [resolved, stored, artifact.id, setValue],
  );

  const isFiltered = controls.some(
    (c) => JSON.stringify(c.value) !== JSON.stringify(c.defaultValue),
  );

  const reset = useCallback(
    () => resetStore(artifact.id),
    [resetStore, artifact.id],
  );

  return {
    filteredSpec,
    controls,
    isFiltered,
    reset,
    totalRows: spec.data.length,
    shownRows: filteredSpec.data.length,
  };
}

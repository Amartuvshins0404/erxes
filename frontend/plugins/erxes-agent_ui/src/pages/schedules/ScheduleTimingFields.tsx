import { useMemo, useState } from 'react';
import { IconClock, IconWorld } from '@tabler/icons-react';
import { Button, Combobox, Command, Input, Label, Popover } from 'erxes-ui';
import {
  buildCron,
  DEFAULT_PARTS,
  describeTiming,
  FREQUENCIES,
  parseCron,
  pad,
  ScheduleFrequency,
  TimingParts,
  WEEKDAYS,
} from './cron';

// ─── Friendly timing builder ──────────────────────────────────────────────────
//
// Most users should never see a cron string: they pick a frequency (hourly /
// daily / weekly / monthly) plus a time, and the builder emits the cron under
// the hood. "Custom" exposes the raw expression for everything else. A saved
// cron that matches a simple pattern reopens in the structured view. The cron
// parse/build/describe helpers live in ./cron.

/** Combobox over the browser-supported IANA timezones, UTC pinned first. */
const SelectTimezone = ({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (tz: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const zones = useMemo<string[]>(() => {
    try {
      // Not in the project's TS lib target yet, but present in every browser
      // this app supports.
      const intl = Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      };
      const all = intl.supportedValuesOf?.('timeZone') ?? [];
      return ['UTC', ...all.filter((z) => z !== 'UTC')];
    } catch {
      return ['UTC'];
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger className="h-9">
        <Combobox.Value value={value || 'UTC'} placeholder="Select timezone…" />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input placeholder="Search timezones…" />
          <Command.List>
            <Combobox.Empty />
            {zones.map((zone) => (
              <Command.Item
                key={zone}
                value={zone}
                onSelect={() => {
                  onValueChange(zone);
                  setOpen(false);
                }}
              >
                {zone}
                <Combobox.Check checked={zone === (value || 'UTC')} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const ScheduleTimingFields = ({
  cron,
  timezone,
  onCronChange,
  onTimezoneChange,
}: {
  cron: string;
  timezone: string;
  onCronChange: (cron: string) => void;
  onTimezoneChange: (timezone: string) => void;
}) => {
  // The cron string is the single source of truth (it's what saves). The
  // builder view is derived from it; only the "Custom" choice is sticky local
  // state, since a parseable cron would otherwise snap back to the builder.
  const parsed = parseCron(cron);
  const [customMode, setCustomMode] = useState(false);
  const parts = parsed ?? DEFAULT_PARTS;
  const freq: ScheduleFrequency =
    customMode || !parsed ? 'custom' : parsed.freq;

  /** Re-emit the cron with some builder parts changed. */
  const apply = (patch: Partial<TimingParts>) =>
    onCronChange(buildCron({ ...parts, ...patch }));

  /** Switch frequency; "Custom" only flips the view, keeping the cron. */
  const pickFrequency = (next: ScheduleFrequency) => {
    if (next === 'custom') {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    apply({ freq: next });
  };

  /** Toggle one weekday in the weekly view. */
  const toggleWeekday = (day: number) => {
    const has = parts.weekdays.includes(day);
    const next = has
      ? parts.weekdays.filter((d) => d !== day)
      : [...parts.weekdays, day];
    // Never allow zero selected days — a weekly schedule must fire somewhere.
    if (next.length) apply({ weekdays: next });
  };

  const timeValue = `${pad(parts.hour)}:${pad(parts.minute)}`;
  /** Push an HH:MM time-input value into the cron. */
  const onTimeChange = (v: string) => {
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(v);
    if (match) {
      apply({
        hour: Number.parseInt(match[1], 10),
        minute: Number.parseInt(match[2], 10),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-medium">Repeats</Label>
        <div className="flex flex-wrap gap-1.5">
          {FREQUENCIES.map((f) => (
            <Button
              key={f.value}
              type="button"
              variant={freq === f.value ? 'secondary' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => pickFrequency(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {freq === 'weekly' && (
        <div className="space-y-1.5">
          <Label className="font-medium">On days</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => (
              <Button
                key={d.value}
                type="button"
                variant={
                  parts.weekdays.includes(d.value) ? 'secondary' : 'outline'
                }
                size="sm"
                className="h-8 w-12"
                onClick={() => toggleWeekday(d.value)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {freq === 'monthly' && (
        <div className="space-y-1.5">
          <Label className="font-medium">Day of month</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={parts.dayOfMonth}
            onChange={(e) => {
              const day = Number.parseInt(e.target.value, 10);
              if (day >= 1 && day <= 31) apply({ dayOfMonth: day });
            }}
            className="w-24"
          />
        </div>
      )}

      {freq === 'hourly' && (
        <div className="space-y-1.5">
          <Label className="font-medium">At minute</Label>
          <Input
            type="number"
            min={0}
            max={59}
            value={parts.minute}
            onChange={(e) => {
              const minute = Number.parseInt(e.target.value, 10);
              if (minute >= 0 && minute <= 59) apply({ minute });
            }}
            className="w-24"
          />
        </div>
      )}

      {(freq === 'daily' || freq === 'weekly' || freq === 'monthly') && (
        <div className="space-y-1.5">
          <Label className="font-medium">At time</Label>
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-32"
          />
        </div>
      )}

      {freq === 'custom' && (
        <div className="space-y-1.5">
          <Label className="font-medium">Cron expression *</Label>
          <Input
            value={cron}
            onChange={(e) => onCronChange(e.target.value)}
            placeholder="0 9 * * *"
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            Standard 5-field cron: minute hour day month weekday.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="font-medium">Timezone</Label>
        <SelectTimezone value={timezone} onValueChange={onTimezoneChange} />
      </div>

      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
        {freq === 'custom' ? (
          <IconClock className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <IconWorld className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span>{describeTiming(freq, parts, cron, timezone)}</span>
      </div>
    </div>
  );
};

import type { LockedModule } from './lockedModules';

const STAT_CARDS = [
  { label: 'Active workflows', value: '24', color: 'bg-violet-500/20 text-violet-700' },
  { label: 'Tasks completed', value: '1,284', color: 'bg-sky-500/20 text-sky-700' },
  { label: 'Success rate', value: '98.2%', color: 'bg-emerald-500/20 text-emerald-700' },
  { label: 'Avg. response', value: '1.2s', color: 'bg-amber-500/20 text-amber-700' },
] as const;

const ACTIVITY_ROWS = [
  { title: 'Generated weekly content plan', meta: '2 min ago · 12 posts scheduled', accent: 'bg-violet-500' },
  { title: 'Synced brand voice guidelines', meta: '18 min ago · 4 documents indexed', accent: 'bg-sky-500' },
  { title: 'Published to LinkedIn & X', meta: '1 hr ago · 3 networks', accent: 'bg-emerald-500' },
  { title: 'Optimized posting schedule', meta: '3 hr ago · peak engagement window', accent: 'bg-orange-500' },
  { title: 'Draft review completed', meta: 'Yesterday · approved by team', accent: 'bg-pink-500' },
] as const;

export const LockedModuleMockBackground = ({
  module,
}: {
  module: LockedModule;
}) => {
  const Icon = module.icon;

  return (
    <div className="flex h-full flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{module.name}</p>
              <p className="text-sm text-muted-foreground">Workspace overview</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {module.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New automation
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">
            Import data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className={`mt-2 inline-flex rounded-md px-2 py-1 text-lg font-semibold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Recent activity</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Live feed
            </span>
          </div>
          <div className="space-y-3">
            {ACTIVITY_ROWS.map((row) => (
              <div
                key={row.title}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className={`mt-1 size-2 shrink-0 rounded-full ${row.accent}`} />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Performance</p>
            <div className="mt-4 flex h-32 items-end gap-2">
              {[40, 68, 52, 84, 61, 92, 74].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-md bg-linear-to-t from-primary/80 to-primary/30"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Connected channels</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['LinkedIn', 'X', 'Instagram', 'Discord', 'Facebook'].map((channel) => (
                <span
                  key={channel}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

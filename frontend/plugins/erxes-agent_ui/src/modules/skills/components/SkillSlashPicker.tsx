import { IconBook2, IconCommand, IconWorld } from '@tabler/icons-react';
import { Spinner } from 'erxes-ui';
import { IMastraInvocableSkill } from '../types';

// The `/slash` skill dropdown shown above the composer. Presentational: keyboard
// navigation (arrows / Enter / Tab / Esc) is owned by useSkillSlashPicker and
// delegated from the composer's textarea; this only renders + handles clicks.
export const SkillSlashPicker = ({
  items,
  activeIndex,
  loading,
  onSelect,
  onHover,
}: {
  items: IMastraInvocableSkill[];
  activeIndex: number;
  loading: boolean;
  onSelect: (skill: IMastraInvocableSkill) => void;
  onHover: (index: number) => void;
}) => (
  <div className="max-w-3xl mx-auto w-full px-3">
    <div className="rounded-xl border bg-popover shadow-md overflow-hidden">
      <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <IconCommand className="size-3.5" /> Skills
      </div>
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <Spinner size="sm" /> Loading skills…
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No matching skills.
        </div>
      ) : (
        <ul className="max-h-64 overflow-auto py-1">
          {items.map((skill, index) => (
            <li key={`${skill.scope}:${skill.name}`}>
              <button
                type="button"
                onMouseEnter={() => onHover(index)}
                onMouseDown={(e) => {
                  // Keep textarea focus; fire before blur.
                  e.preventDefault();
                  onSelect(skill);
                }}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                  index === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                {skill.scope === 'global' ? (
                  <IconWorld className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <IconBook2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-medium">
                      /{skill.name}
                    </span>
                    <span className="rounded bg-muted px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {skill.scope}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {skill.description}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

import { useQuery } from '@apollo/client';
import { Badge, Button, Checkbox, Command, cn, Spinner } from 'erxes-ui';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { AutomationAiKnowledgeSourceSelectorProps } from 'ui-modules';
import { EVENTS } from '@/events/graphql/queries';
import { IEventList } from '~/types/event';

const formatEventDate = (startDate?: string | null) => {
  if (!startDate) {
    return '';
  }

  return new Date(startDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const EventKnowledgeSourceSelector = ({
  value,
  onChange,
  statuses = [],
}: AutomationAiKnowledgeSourceSelectorProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue] = useDebounce(searchValue, 300);
  const { data, loading, error } = useQuery<{ events: IEventList }>(EVENTS, {
    variables: {
      searchValue: debouncedSearchValue || undefined,
      status: 'published',
      limit: 100,
    },
  });
  const events = data?.events?.list || [];
  const statusesByEventId = new Map(
    statuses.map((status) => [status.sourceId, status]),
  );

  const toggleEvent = (eventId: string) => {
    onChange(
      value.includes(eventId)
        ? value.filter((selectedId) => selectedId !== eventId)
        : [...value, eventId],
    );
  };

  const visibleIds = events.map((event) => event._id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => value.includes(id));

  const toggleSelectAllVisible = () => {
    onChange(
      allVisibleSelected
        ? value.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...value, ...visibleIds])),
    );
  };

  return (
    <Command shouldFilter={false} className="rounded-md border">
      <Command.Input
        value={searchValue}
        onValueChange={setSearchValue}
        placeholder="Search published events"
        variant="secondary"
      />
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {value.length} event{value.length === 1 ? '' : 's'} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          className="h-6 px-2 text-xs"
          disabled={loading || events.length === 0}
          onClick={toggleSelectAllVisible}
        >
          {allVisibleSelected ? 'Clear selection' : 'Select all'}
        </Button>
      </div>
      <Command.List className="max-h-72 space-y-1.5 overflow-y-auto p-1.5">
        {loading && (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <Command.Empty>Failed to load events.</Command.Empty>
        )}

        {!loading && !error && events.length === 0 && (
          <Command.Empty>No published events found.</Command.Empty>
        )}

        {!loading &&
          events.map((event) => {
            const isSelected = value.includes(event._id);
            const status = statusesByEventId.get(event._id);
            const eventDate = formatEventDate(event.startDate);

            return (
              <Command.Item
                key={event._id}
                value={event._id}
                onSelect={() => toggleEvent(event._id)}
                className={cn(
                  'flex h-auto min-h-12 items-start gap-3 rounded-md px-3 py-2.5',
                  isSelected && 'bg-accent',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleEvent(event._id)}
                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-medium">
                        {event.name || 'Untitled event'}
                      </p>
                      {eventDate && (
                        <span className="shrink-0 text-[10px] leading-4 text-muted-foreground">
                          {eventDate}
                        </span>
                      )}
                    </div>
                    {status && (
                      <Badge
                        variant={getStatusVariant(status.status)}
                        className="shrink-0"
                      >
                        {status.status}
                      </Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {status?.status === 'indexed' && (
                    <p className="text-xs text-muted-foreground">
                      {status.chunkCount || 0} indexed chunks
                    </p>
                  )}
                  {(status?.status === 'failed' ||
                    status?.status === 'skipped') &&
                    status.indexError && (
                      <p className="text-xs text-destructive">
                        {status.indexError}
                      </p>
                    )}
                </div>
              </Command.Item>
            );
          })}
      </Command.List>
    </Command>
  );
};

const getStatusVariant = (
  status: NonNullable<
    AutomationAiKnowledgeSourceSelectorProps['statuses']
  >[number]['status'],
) => {
  if (status === 'indexed') {
    return 'success' as const;
  }

  if (status === 'indexing' || status === 'queued') {
    return 'warning' as const;
  }

  if (status === 'failed') {
    return 'destructive' as const;
  }

  return 'secondary' as const;
};

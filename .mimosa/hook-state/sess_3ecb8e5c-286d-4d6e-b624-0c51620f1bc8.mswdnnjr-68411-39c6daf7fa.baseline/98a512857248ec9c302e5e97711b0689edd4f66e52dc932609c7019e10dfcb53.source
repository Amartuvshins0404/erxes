import { zodResolver } from '@hookform/resolvers/zod';
import { IconDownload } from '@tabler/icons-react';
import {
  Button,
  FocusSheet,
  Form,
  InfoCard,
  Input,
  ScrollArea,
  Select,
  Sheet,
  Sidebar,
  Spinner,
  Textarea,
  useQueryState,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { AgendaEditor } from '@/events/components/AgendaEditor';
import { AttendanceList } from '@/events/components/AttendanceList';
import { AttendanceSummaryBar } from '@/events/components/AttendanceSummaryBar';
import { DateTimeField } from '@/events/components/DateTimeField';
import { EventLocationFields } from '@/events/components/EventLocationFields';
import { EventMediaFields } from '@/events/components/EventMediaFields';
import {
  EVENT_FORM_DEFAULTS,
  EventFormValues,
  eventFormSchema,
} from '@/events/components/eventFormSchema';
import {
  useAttendanceSummary,
  useEventDetail,
} from '@/events/hooks/useEventDetail';
import { useEventMutations } from '@/events/hooks/useEventMutations';
import { ATTENDANCE_LABELS, EVENT_STATUS_OPTIONS } from '~/lib/constants';
import { downloadCsv, toCsv } from '~/lib/csv';
import { IAttendanceSummary, IEvent, InvitationStatus } from '~/types/event';

const SECTIONS = [
  { value: 'general', label: 'General' },
  { value: 'media', label: 'Media' },
  { value: 'location', label: 'Location' },
  { value: 'agenda', label: 'Agenda' },
] as const;

const ATTENDANCE_SECTION = {
  value: 'attendance',
  label: 'Attendance',
} as const;

type SectionValue =
  | (typeof SECTIONS)[number]['value']
  | typeof ATTENDANCE_SECTION.value;

const SECTION_BY_FIELD: Record<string, SectionValue> = {
  name: 'general',
  description: 'general',
  status: 'general',
  startDate: 'general',
  endDate: 'general',
  capacity: 'general',
  coverImage: 'media',
  images: 'media',
  videoUrl: 'media',
  location: 'location',
  isOnline: 'location',
  onlineUrl: 'location',
  agenda: 'agenda',
};

const toFormValues = (event: IEvent): EventFormValues => ({
  name: event.name ?? '',
  description: event.description ?? '',
  coverImage: event.coverImage ?? '',
  images: event.images ?? [],
  videoUrl: event.videoUrl ?? '',
  startDate: event.startDate ?? '',
  endDate: event.endDate ?? '',
  location: {
    city: event.location?.city ?? '',
    district: event.location?.district ?? '',
    address: event.location?.address ?? '',
    lat: event.location?.lat ?? undefined,
    lng: event.location?.lng ?? undefined,
  },
  isOnline: event.isOnline ?? false,
  onlineUrl: event.onlineUrl ?? '',
  capacity: event.capacity != null ? String(event.capacity) : '',
  status: event.status ?? 'draft',
  agenda: (event.agenda ?? []).map((item) => ({
    startTime: item.startTime,
    endTime: item.endTime,
    title: item.title,
    description: item.description ?? '',
  })),
});

const GeneralFields = ({ form }: { form: UseFormReturn<EventFormValues> }) => (
  <div className="flex flex-col gap-4">
    <InfoCard title="General">
      <InfoCard.Content className="gap-4 grid grid-cols-2">
        <Form.Field
          control={form.control}
          name="name"
          render={({ field }) => (
            <Form.Item className="col-span-2">
              <Form.Label>Name</Form.Label>
              <Form.Control>
                <Input placeholder="Developer Networking Night" {...field} />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item className="col-span-2">
              <Form.Label>Description</Form.Label>
              <Form.Control>
                <Textarea rows={4} {...field} />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="status"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Status</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {EVENT_STATUS_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Capacity</Form.Label>
              <Form.Control>
                <Input type="number" min={1} placeholder="150" {...field} />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>

    <InfoCard title="Schedule">
      <InfoCard.Content className="gap-4 grid grid-cols-2">
        <Form.Field
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Starts</Form.Label>
              <DateTimeField
                value={field.value}
                onChange={field.onChange}
                placeholder="Start date"
                aria-label="Start time"
              />
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Ends</Form.Label>
              <DateTimeField
                value={field.value}
                onChange={field.onChange}
                placeholder="End date"
                aria-label="End time"
              />
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>
  </div>
);

const buildAttendanceCsv = (event: IEvent, summary: IAttendanceSummary) =>
  toCsv(
    ['Event', 'Status', 'Count', 'Percentage'],
    summary.counts.map((entry) => [
      event.name,
      ATTENDANCE_LABELS[entry.status],
      entry.count,
      `${entry.percentage}%`,
    ]),
  );

const AttendanceSection = ({ event }: { event: IEvent }) => {
  const { summary, loading } = useAttendanceSummary(event._id);
  const [statusFilter, setStatusFilter] = useState<
    InvitationStatus | undefined
  >(undefined);

  const handleExport = () => {
    if (!summary) {
      return;
    }

    downloadCsv(
      `${event.name.replace(/[^\wЀ-ӿ-]+/g, '-')}-attendance.csv`,
      buildAttendanceCsv(event, summary),
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <InfoCard title="Attendance">
        <InfoCard.Content className="gap-4">
          <AttendanceSummaryBar
            summary={summary}
            loading={loading}
            selectedStatus={statusFilter}
            onSelectStatus={setStatusFilter}
          />

          {/* <div className="flex justify-end items-center pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!summary || summary.total === 0}
              onClick={handleExport}
            >
              <IconDownload className="size-3.5" />
              Export
            </Button>
          </div> */}
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title="Attendees" className="flex-1">
        <InfoCard.Content>
          <AttendanceList eventId={event._id} status={statusFilter} />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const EventFormSheet = () => {
  const [editEventId, setEditEventId] = useQueryState<string>('editEventId');
  const isEditing = !!editEventId && editEventId !== 'new';
  const open = !!editEventId;

  const {
    event,
    loading: eventLoading,
    error: eventError,
  } = useEventDetail(isEditing ? editEventId : null);

  const { createEvent, updateEvent, loading } = useEventMutations();
  const [section, setSection] = useState<SectionValue>('general');

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: EVENT_FORM_DEFAULTS,
  });

  const { reset } = form;

  useEffect(() => {
    if (!open || (isEditing && !event)) {
      return;
    }

    reset(event ? toFormValues(event) : EVENT_FORM_DEFAULTS);
    setSection('general');
  }, [open, isEditing, event, reset]);

  const onOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEditEventId(null);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    const doc = {
      name: values.name,
      description: values.description || undefined,
      coverImage: values.coverImage || undefined,
      images: values.images,
      videoUrl: values.videoUrl || undefined,
      startDate: values.startDate,
      endDate: values.endDate,
      location: values.isOnline ? undefined : values.location,
      isOnline: values.isOnline,
      onlineUrl: values.isOnline ? values.onlineUrl || undefined : undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
      status: values.status,
      agenda: values.agenda.map((item) => ({
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        description: item.description || undefined,
      })),
    };

    const result = event
      ? await updateEvent(event._id, doc)
      : await createEvent(doc);

    if (result?.data) {
      setEditEventId(null);
    }
  };

  const revealFirstError = (errors: Record<string, unknown>) => {
    const target = SECTION_BY_FIELD[Object.keys(errors)[0]];

    if (target) {
      setSection(target);
    }
  };

  const sectionsWithErrors = new Set(
    Object.keys(form.formState.errors)
      .map((field) => SECTION_BY_FIELD[field])
      .filter(Boolean),
  );

  const sections = event ? [...SECTIONS, ATTENDANCE_SECTION] : SECTIONS;

  return (
    <FocusSheet open={open} onOpenChange={onOpenChange}>
      <FocusSheet.View
        className="lg:w-3/4"
        loading={isEditing && eventLoading}
        error={isEditing && !!eventError}
        notFound={isEditing && !eventLoading && !eventError && !event}
      >
        <FocusSheet.Header title={isEditing ? 'Edit event' : 'Add event'} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, revealFirstError)}
            className="flex flex-col flex-auto min-h-0 overflow-hidden"
          >
            <FocusSheet.Content className="flex-auto p-0 min-h-0">
              <FocusSheet.SideBar>
                <Sidebar.Content>
                  <Sidebar.Group>
                    <Sidebar.GroupContent className="mt-2">
                      <Sidebar.Menu>
                        {sections.map(({ value, label }) => (
                          <Sidebar.MenuItem key={value}>
                            <Sidebar.MenuButton
                              type="button"
                              isActive={section === value}
                              onClick={() => setSection(value)}
                            >
                              {label}
                              {sectionsWithErrors.has(value) && (
                                <span
                                  aria-label="Has errors"
                                  className="bg-destructive ml-auto rounded-full size-1.5"
                                />
                              )}
                            </Sidebar.MenuButton>
                          </Sidebar.MenuItem>
                        ))}
                      </Sidebar.Menu>
                    </Sidebar.GroupContent>
                  </Sidebar.Group>
                </Sidebar.Content>
              </FocusSheet.SideBar>

              <ScrollArea className="w-full h-full">
                <div className="p-4 h-full">
                  {section === 'general' && <GeneralFields form={form} />}
                  {section === 'media' && <EventMediaFields form={form} />}
                  {section === 'location' && (
                    <EventLocationFields form={form} />
                  )}
                  {section === 'agenda' && (
                    <InfoCard title="Agenda">
                      <InfoCard.Content>
                        <AgendaEditor form={form} />
                      </InfoCard.Content>
                    </InfoCard>
                  )}
                  {section === 'attendance' && event && (
                    <AttendanceSection event={event} />
                  )}
                </div>
              </ScrollArea>
            </FocusSheet.Content>

            <Sheet.Footer className="flex-none">
              <Sheet.Close asChild>
                <Button variant="secondary" className="bg-border">
                  Cancel
                </Button>
              </Sheet.Close>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner containerClassName="flex-none" /> : null}
                {isEditing ? 'Save changes' : 'Create event'}
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </FocusSheet.View>
    </FocusSheet>
  );
};

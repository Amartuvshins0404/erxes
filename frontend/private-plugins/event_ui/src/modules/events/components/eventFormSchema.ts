import { z } from 'zod';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const agendaItemSchema = z
  .object({
    startTime: z.string().regex(TIME_PATTERN, 'Use HH:mm'),
    endTime: z.string().regex(TIME_PATTERN, 'Use HH:mm'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  })
  .refine((item) => toMinutes(item.endTime) > toMinutes(item.startTime), {
    message: 'Must end after it starts',
    path: ['endTime'],
  });

const locationSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const eventFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(z.string()),
    videoUrl: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    location: locationSchema,
    isOnline: z.boolean(),
    onlineUrl: z.string().optional(),
    capacity: z.string().optional(),
    status: z.enum(['draft', 'published', 'cancelled']),
    agenda: z.array(agendaItemSchema),
  })
  .refine(
    (values) => new Date(values.endDate) >= new Date(values.startDate),
    { message: 'End date must be on or after start date', path: ['endDate'] },
  )
  .refine(
    (values) => !values.isOnline || !!values.onlineUrl?.trim(),
    { message: 'An online event needs a link', path: ['onlineUrl'] },
  )
  .refine(
    (values) =>
      !values.capacity ||
      (Number.isInteger(Number(values.capacity)) && Number(values.capacity) > 0),
    { message: 'Capacity must be a whole number above zero', path: ['capacity'] },
  )
  .refine(
    (values) => {
      const ordered = [...values.agenda].sort(
        (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
      );

      return ordered.every(
        (item, index) =>
          index === 0 ||
          toMinutes(item.startTime) >= toMinutes(ordered[index - 1].endTime),
      );
    },
    { message: 'Agenda items overlap', path: ['agenda'] },
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const EVENT_FORM_DEFAULTS: EventFormValues = {
  name: '',
  description: '',
  coverImage: '',
  images: [],
  videoUrl: '',
  startDate: '',
  endDate: '',
  location: { city: '', district: '', address: '' },
  isOnline: false,
  onlineUrl: '',
  capacity: '',
  status: 'draft',
  agenda: [],
};

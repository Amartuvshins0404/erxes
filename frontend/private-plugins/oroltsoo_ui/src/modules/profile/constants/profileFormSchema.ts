import { z } from 'zod';

const text = z.string().trim();

const optionalUrl = text.refine(
  (value) => !value || /^https?:\/\/\S+$/i.test(value),
  { message: 'http:// эсвэл https:// эхэлсэн хаяг оруулна уу' },
);

export const profilePromiseSchema = z.object({
  title: text.min(1, 'Амлалтын гарчгийг оруулна уу'),
  description: text,
  status: z.enum(['planned', 'inProgress', 'done', 'dropped']),
  progress: z
    .number({ invalid_type_error: '0-100 хооронд тоо оруулна уу' })
    .int('Бүхэл тоо оруулна уу')
    .min(0, '0-100 хооронд байна')
    .max(100, '0-100 хооронд байна'),
});

export const profileLinkSchema = z.object({
  title: text.min(1, 'Гарчгийг оруулна уу'),
  url: text
    .min(1, 'Холбоосыг оруулна уу')
    .regex(/^https?:\/\/\S+$/i, 'http:// эсвэл https:// эхэлсэн хаяг оруулна уу'),
  publishedAt: z.date().nullable(),
});

const year = z
  .number({ invalid_type_error: 'Он оруулна уу' })
  .int('Бүхэл тоо оруулна уу')
  .min(1900, '1900-2200 хооронд байна')
  .max(2200, '1900-2200 хооронд байна')
  .nullable();

const percent = z
  .number({ invalid_type_error: 'Хувь оруулна уу' })
  .min(0, '0-100 хооронд байна')
  .max(100, '0-100 хооронд байна')
  .nullable();

const count = z
  .number({ invalid_type_error: 'Тоо оруулна уу' })
  .int('Бүхэл тоо оруулна уу')
  .min(0, 'Сөрөг байж болохгүй')
  .nullable();

const money = z
  .number({ invalid_type_error: 'Дүн оруулна уу' })
  .min(0, 'Сөрөг байж болохгүй')
  .nullable();

const yearRange = (values: { startYear: number | null; endYear: number | null }) =>
  !values.startYear || !values.endYear || values.endYear >= values.startYear;

const YEAR_RANGE_ERROR = {
  message: 'Дуусах он эхэлсэн оноос өмнө байж болохгүй',
  path: ['endYear'],
};

export const profileBillSchema = z.object({
  title: text.min(1, 'Хуулийн төслийн нэрийг оруулна уу'),
  stage: z.enum(['submitted', 'inDebate', 'passed', 'rejected', 'withdrawn']),
  role: z.enum(['sponsor', 'coSponsor']),
  submittedAt: z.date().nullable(),
  url: optionalUrl,
  description: text,
});

export const profileDonationSchema = z.object({
  donor: text.min(1, 'Хандивлагчийн нэрийг оруулна уу'),
  amount: z
    .number({ invalid_type_error: 'Дүн оруулна уу' })
    .min(0, 'Сөрөг байж болохгүй'),
  receivedAt: z.date().nullable(),
  url: optionalUrl,
});

export const profileEducationSchema = z
  .object({
    school: text.min(1, 'Сургуулийн нэрийг оруулна уу'),
    degree: text,
    field: text,
    startYear: year,
    endYear: year,
  })
  .refine(yearRange, YEAR_RANGE_ERROR);

export const profileCareerSchema = z
  .object({
    organization: text.min(1, 'Байгууллагын нэрийг оруулна уу'),
    position: text.min(1, 'Албан тушаалыг оруулна уу'),
    startYear: year,
    endYear: year,
    description: text,
  })
  .refine(yearRange, YEAR_RANGE_ERROR);

export const profileFormSchema = z
  .object({
    firstName: text.min(1, 'Нэрийг оруулна уу'),
    lastName: text,
    avatar: text,
    coverImage: text,

    position: text,
    party: text,
    organization: text,
    district: text,
    territory: text,
    mandateType: z.enum(['', 'electorate', 'list', 'appointed']),
    termStart: z.date().nullable(),
    termEnd: z.date().nullable(),
    status: z.enum(['draft', 'published', 'archived']),

    introduction: text,
    positionDescription: text,
    territoryDescription: text,

    education: z.array(profileEducationSchema),
    career: z.array(profileCareerSchema),

    achievements: text,
    policyStance: text,
    parliamentActivity: text,
    votingSummary: text,
    promises: z.array(profilePromiseSchema),
    bills: z.array(profileBillSchema),
    attendance: z.object({
      periodLabel: text,
      sessionAttendanceRate: percent,
      committeeAttendanceRate: percent,
      attendedSessions: count,
      totalSessions: count,
      sourceUrl: optionalUrl,
    }),

    feedbackNote: text,
    requestProcessNote: text,

    transparencyNote: text,
    reports: z.array(profileLinkSchema),
    newsLinks: z.array(profileLinkSchema),

    finance: z.object({
      assetDeclarationUrl: optionalUrl,
      assetDeclarationDate: z.date().nullable(),
      interestDeclarationUrl: optionalUrl,
      interestDeclarationDate: z.date().nullable(),
      campaignExpense: money,
      campaignExpenseUrl: optionalUrl,
      donations: z.array(profileDonationSchema),
    }),

    contact: z.object({
      email: text.refine(
        (value) => !value || z.string().email().safeParse(value).success,
        { message: 'Зөв и-мэйл хаяг оруулна уу' },
      ),
      phone: text,
      address: text,
      officeHours: text,
      socialLinks: z.object({
        facebook: optionalUrl,
        twitter: optionalUrl,
        instagram: optionalUrl,
        youtube: optionalUrl,
        website: optionalUrl,
      }),
    }),
  })
  .refine(
    (values) =>
      !values.termStart || !values.termEnd || values.termEnd >= values.termStart,
    {
      message: 'Дуусах огноо эхлэх огнооноос өмнө байж болохгүй',
      path: ['termEnd'],
    },
  )
  .refine(
    (values) =>
      values.attendance.attendedSessions === null ||
      values.attendance.totalSessions === null ||
      values.attendance.attendedSessions <= values.attendance.totalSessions,
    {
      message: 'Ирсэн тоо нийт тооноос их байж болохгүй',
      path: ['attendance', 'attendedSessions'],
    },
  );

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

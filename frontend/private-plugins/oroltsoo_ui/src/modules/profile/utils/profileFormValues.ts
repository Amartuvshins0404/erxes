import { ProfileFormValues } from '../constants/profileFormSchema';
import { IProfile } from '../types/profile';

const toDate = (value?: string | null) => (value ? new Date(value) : null);

const toIso = (value?: Date | null) => (value ? value.toISOString() : null);

export const EMPTY_PROFILE_FORM_VALUES: ProfileFormValues = {
  firstName: '',
  lastName: '',
  avatar: '',
  coverImage: '',

  position: '',
  party: '',
  organization: '',
  district: '',
  territory: '',
  mandateType: '',
  termStart: null,
  termEnd: null,
  status: 'draft',

  introduction: '',
  positionDescription: '',
  territoryDescription: '',

  education: [],
  career: [],

  achievements: '',
  policyStance: '',
  parliamentActivity: '',
  votingSummary: '',
  promises: [],
  bills: [],
  attendance: {
    periodLabel: '',
    sessionAttendanceRate: null,
    committeeAttendanceRate: null,
    attendedSessions: null,
    totalSessions: null,
    sourceUrl: '',
  },

  feedbackNote: '',
  requestProcessNote: '',

  transparencyNote: '',
  reports: [],
  newsLinks: [],

  finance: {
    assetDeclarationUrl: '',
    assetDeclarationDate: null,
    interestDeclarationUrl: '',
    interestDeclarationDate: null,
    campaignExpense: null,
    campaignExpenseUrl: '',
    donations: [],
  },

  contact: {
    email: '',
    phone: '',
    address: '',
    officeHours: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      website: '',
    },
  },
};

export const toProfileFormValues = (profile: IProfile): ProfileFormValues => ({
  firstName: profile.firstName ?? '',
  lastName: profile.lastName ?? '',
  avatar: profile.avatar ?? '',
  coverImage: profile.coverImage ?? '',

  position: profile.position ?? '',
  party: profile.party ?? '',
  organization: profile.organization ?? '',
  district: profile.district ?? '',
  territory: profile.territory ?? '',
  mandateType: profile.mandateType ?? '',
  termStart: toDate(profile.termStart),
  termEnd: toDate(profile.termEnd),
  status: profile.status ?? 'draft',

  introduction: profile.introduction ?? '',
  positionDescription: profile.positionDescription ?? '',
  territoryDescription: profile.territoryDescription ?? '',

  education: (profile.education ?? []).map((item) => ({
    school: item.school ?? '',
    degree: item.degree ?? '',
    field: item.field ?? '',
    startYear: item.startYear ?? null,
    endYear: item.endYear ?? null,
  })),
  career: (profile.career ?? []).map((item) => ({
    organization: item.organization ?? '',
    position: item.position ?? '',
    startYear: item.startYear ?? null,
    endYear: item.endYear ?? null,
    description: item.description ?? '',
  })),

  achievements: profile.achievements ?? '',
  policyStance: profile.policyStance ?? '',
  parliamentActivity: profile.parliamentActivity ?? '',
  votingSummary: profile.votingSummary ?? '',
  promises: (profile.promises ?? []).map((promise) => ({
    title: promise.title ?? '',
    description: promise.description ?? '',
    status: promise.status ?? 'planned',
    progress: promise.progress ?? 0,
  })),
  bills: (profile.bills ?? []).map((bill) => ({
    title: bill.title ?? '',
    stage: bill.stage ?? 'submitted',
    role: bill.role ?? 'sponsor',
    submittedAt: toDate(bill.submittedAt),
    url: bill.url ?? '',
    description: bill.description ?? '',
  })),
  attendance: {
    periodLabel: profile.attendance?.periodLabel ?? '',
    sessionAttendanceRate: profile.attendance?.sessionAttendanceRate ?? null,
    committeeAttendanceRate:
      profile.attendance?.committeeAttendanceRate ?? null,
    attendedSessions: profile.attendance?.attendedSessions ?? null,
    totalSessions: profile.attendance?.totalSessions ?? null,
    sourceUrl: profile.attendance?.sourceUrl ?? '',
  },

  feedbackNote: profile.feedbackNote ?? '',
  requestProcessNote: profile.requestProcessNote ?? '',

  transparencyNote: profile.transparencyNote ?? '',
  reports: (profile.reports ?? []).map((report) => ({
    title: report.title ?? '',
    url: report.url ?? '',
    publishedAt: toDate(report.publishedAt),
  })),
  newsLinks: (profile.newsLinks ?? []).map((link) => ({
    title: link.title ?? '',
    url: link.url ?? '',
    publishedAt: toDate(link.publishedAt),
  })),

  finance: {
    assetDeclarationUrl: profile.finance?.assetDeclarationUrl ?? '',
    assetDeclarationDate: toDate(profile.finance?.assetDeclarationDate),
    interestDeclarationUrl: profile.finance?.interestDeclarationUrl ?? '',
    interestDeclarationDate: toDate(profile.finance?.interestDeclarationDate),
    campaignExpense: profile.finance?.campaignExpense ?? null,
    campaignExpenseUrl: profile.finance?.campaignExpenseUrl ?? '',
    donations: (profile.finance?.donations ?? []).map((donation) => ({
      donor: donation.donor ?? '',
      amount: donation.amount ?? 0,
      receivedAt: toDate(donation.receivedAt),
      url: donation.url ?? '',
    })),
  },

  contact: {
    email: profile.contact?.email ?? '',
    phone: profile.contact?.phone ?? '',
    address: profile.contact?.address ?? '',
    officeHours: profile.contact?.officeHours ?? '',
    socialLinks: {
      facebook: profile.contact?.socialLinks?.facebook ?? '',
      twitter: profile.contact?.socialLinks?.twitter ?? '',
      instagram: profile.contact?.socialLinks?.instagram ?? '',
      youtube: profile.contact?.socialLinks?.youtube ?? '',
      website: profile.contact?.socialLinks?.website ?? '',
    },
  },
});

export const toProfileInput = (values: ProfileFormValues) => ({
  ...values,
  termStart: toIso(values.termStart),
  termEnd: toIso(values.termEnd),
  promises: values.promises.map((promise) => ({ ...promise })),
  bills: values.bills.map((bill) => ({
    ...bill,
    submittedAt: toIso(bill.submittedAt),
  })),
  finance: {
    ...values.finance,
    assetDeclarationDate: toIso(values.finance.assetDeclarationDate),
    interestDeclarationDate: toIso(values.finance.interestDeclarationDate),
    donations: values.finance.donations.map((donation) => ({
      ...donation,
      receivedAt: toIso(donation.receivedAt),
    })),
  },
  reports: values.reports.map((report) => ({
    ...report,
    publishedAt: toIso(report.publishedAt),
  })),
  newsLinks: values.newsLinks.map((link) => ({
    ...link,
    publishedAt: toIso(link.publishedAt),
  })),
});

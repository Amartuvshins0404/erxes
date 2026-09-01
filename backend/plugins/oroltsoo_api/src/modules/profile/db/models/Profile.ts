import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import {
  IProfile,
  IProfileAttendance,
  IProfileBill,
  IProfileCareer,
  IProfileContact,
  IProfileDocument,
  IProfileDonation,
  IProfileEducation,
  IProfileFinance,
  IProfileLink,
  IProfilePromise,
  IProfileSocialLinks,
} from '@/profile/@types/profile';
import { IProfileReview } from '@/profile/@types/profile';
import { profileSchema } from '@/profile/db/definitions/profile';
import { IModels } from '~/connectionResolvers';
import { clampOptional, toDate, trim } from '~/utils/normalize';
import {
  BILL_ROLES,
  BILL_STAGES,
  MANDATE_TYPES,
  PROFILE_STATUSES,
  PROMISE_STATUSES,
  REVIEW_STATUSES,
} from '~/constants';

export interface IProfileModel extends Model<IProfileDocument> {
  getProfileInfo(): Promise<IProfileDocument>;
  updateProfileInfo(doc: IProfile): Promise<IProfileDocument>;
  applyReview(
    entityId: string,
    review: IProfileReview,
  ): Promise<IProfileDocument | null>;
}

const normalizePromises = (promises?: IProfilePromise[]) =>
  (promises || [])
    .filter((promise) => trim(promise.title))
    .map((promise) => ({
      title: trim(promise.title),
      description: trim(promise.description),
      status: PROMISE_STATUSES.ALL.includes(promise.status)
        ? promise.status
        : PROMISE_STATUSES.PLANNED,
      progress: Math.min(Math.max(Math.round(Number(promise.progress) || 0), 0), 100),
    }));

const normalizeLinks = (links?: IProfileLink[]) =>
  (links || [])
    .filter((link) => trim(link.title) && trim(link.url))
    .map((link) => ({
      title: trim(link.title),
      url: trim(link.url),
      publishedAt: toDate(link.publishedAt),
    }));

const normalizeBills = (bills?: IProfileBill[]) =>
  (bills || [])
    .filter((bill) => trim(bill.title))
    .map((bill) => ({
      title: trim(bill.title),
      stage: BILL_STAGES.ALL.includes(bill.stage)
        ? bill.stage
        : BILL_STAGES.SUBMITTED,
      role: BILL_ROLES.ALL.includes(bill.role) ? bill.role : BILL_ROLES.SPONSOR,
      submittedAt: toDate(bill.submittedAt),
      url: trim(bill.url),
      description: trim(bill.description),
    }));

const normalizeDonations = (donations?: IProfileDonation[]) =>
  (donations || [])
    .filter((donation) => trim(donation.donor))
    .map((donation) => ({
      donor: trim(donation.donor),
      amount: Math.max(Number(donation.amount) || 0, 0),
      receivedAt: toDate(donation.receivedAt),
      url: trim(donation.url),
    }));

const normalizeFinance = (finance?: IProfileFinance) => ({
  assetDeclarationUrl: trim(finance?.assetDeclarationUrl),
  assetDeclarationDate: toDate(finance?.assetDeclarationDate),
  interestDeclarationUrl: trim(finance?.interestDeclarationUrl),
  interestDeclarationDate: toDate(finance?.interestDeclarationDate),
  campaignExpense: clampOptional(
    finance?.campaignExpense,
    0,
    Number.MAX_SAFE_INTEGER,
  ),
  campaignExpenseUrl: trim(finance?.campaignExpenseUrl),
  donations: normalizeDonations(finance?.donations),
});

const normalizeAttendance = (attendance?: IProfileAttendance) => ({
  periodLabel: trim(attendance?.periodLabel),
  sessionAttendanceRate: clampOptional(
    attendance?.sessionAttendanceRate,
    0,
    100,
  ),
  committeeAttendanceRate: clampOptional(
    attendance?.committeeAttendanceRate,
    0,
    100,
  ),
  attendedSessions: clampOptional(
    attendance?.attendedSessions,
    0,
    Number.MAX_SAFE_INTEGER,
  ),
  totalSessions: clampOptional(
    attendance?.totalSessions,
    0,
    Number.MAX_SAFE_INTEGER,
  ),
  sourceUrl: trim(attendance?.sourceUrl),
});

const normalizeEducation = (education?: IProfileEducation[]) =>
  (education || [])
    .filter((item) => trim(item.school))
    .map((item) => ({
      school: trim(item.school),
      degree: trim(item.degree),
      field: trim(item.field),
      startYear: clampOptional(item.startYear, 1900, 2200),
      endYear: clampOptional(item.endYear, 1900, 2200),
    }));

const normalizeCareer = (career?: IProfileCareer[]) =>
  (career || [])
    .filter((item) => trim(item.organization) && trim(item.position))
    .map((item) => ({
      organization: trim(item.organization),
      position: trim(item.position),
      startYear: clampOptional(item.startYear, 1900, 2200),
      endYear: clampOptional(item.endYear, 1900, 2200),
      description: trim(item.description),
    }));

const normalizeSocialLinks = (socialLinks?: IProfileSocialLinks) => ({
  facebook: trim(socialLinks?.facebook),
  twitter: trim(socialLinks?.twitter),
  instagram: trim(socialLinks?.instagram),
  youtube: trim(socialLinks?.youtube),
  website: trim(socialLinks?.website),
});

const normalizeContact = (contact?: IProfileContact) => ({
  email: trim(contact?.email),
  phone: trim(contact?.phone),
  address: trim(contact?.address),
  officeHours: trim(contact?.officeHours),
  socialLinks: normalizeSocialLinks(contact?.socialLinks),
});

const normalizeProfile = (doc: IProfile) => {
  const firstName = trim(doc.firstName);

  if (!firstName) {
    throw new ExpectedError('Улс төрчийн нэрийг оруулна уу', 'BAD_USER_INPUT');
  }

  const termStart = toDate(doc.termStart);
  const termEnd = toDate(doc.termEnd);

  if (termStart && termEnd && termEnd < termStart) {
    throw new ExpectedError(
      'Бүрэн эрхийн дуусах огноо эхлэх огнооноос өмнө байж болохгүй',
      'BAD_USER_INPUT',
    );
  }

  return {
    firstName,
    lastName: trim(doc.lastName),
    avatar: trim(doc.avatar),
    coverImage: trim(doc.coverImage),

    position: trim(doc.position),
    party: trim(doc.party),
    organization: trim(doc.organization),
    district: trim(doc.district),
    territory: trim(doc.territory),
    mandateType: MANDATE_TYPES.ALL.includes(doc.mandateType || '')
      ? doc.mandateType
      : '',
    termStart,
    termEnd,
    status: PROFILE_STATUSES.ALL.includes(doc.status)
      ? doc.status
      : PROFILE_STATUSES.DRAFT,

    introduction: trim(doc.introduction),
    positionDescription: trim(doc.positionDescription),
    territoryDescription: trim(doc.territoryDescription),

    education: normalizeEducation(doc.education),
    career: normalizeCareer(doc.career),

    achievements: trim(doc.achievements),
    policyStance: trim(doc.policyStance),
    parliamentActivity: trim(doc.parliamentActivity),
    votingSummary: trim(doc.votingSummary),
    promises: normalizePromises(doc.promises),
    bills: normalizeBills(doc.bills),
    attendance: normalizeAttendance(doc.attendance),

    feedbackNote: trim(doc.feedbackNote),
    requestProcessNote: trim(doc.requestProcessNote),

    transparencyNote: trim(doc.transparencyNote),
    reports: normalizeLinks(doc.reports),
    newsLinks: normalizeLinks(doc.newsLinks),

    contact: normalizeContact(doc.contact),
    finance: normalizeFinance(doc.finance),
  };
};

export const loadProfileClass = (models: IModels) => {
  class Profile {
    public static async getProfileInfo() {
      const profile = await models.Profile.findOne({});

      if (profile) {
        return profile;
      }

      return models.Profile.create({ status: PROFILE_STATUSES.DRAFT });
    }

    public static async updateProfileInfo(doc: IProfile) {
      const existing = await models.Profile.getProfileInfo();

      return models.Profile.findOneAndUpdate(
        { _id: existing._id },
        { $set: normalizeProfile(doc) },
        { new: true },
      );
    }

    public static async applyReview(entityId: string, review: IProfileReview) {
      if (!REVIEW_STATUSES.ALL.includes(review.reviewStatus)) {
        throw new ExpectedError('Хяналтын төлөв буруу байна', 'BAD_USER_INPUT');
      }

      return models.Profile.findOneAndUpdate(
        { _id: entityId },
        {
          $set: {
            reviewStatus: review.reviewStatus,
            reviewNote: (review.reviewNote ?? '').trim(),
            reviewedAt: review.reviewedAt
              ? new Date(review.reviewedAt)
              : new Date(),
          },
        },
        { new: true },
      );
    }
  }

  profileSchema.loadClass(Profile);

  return profileSchema;
};

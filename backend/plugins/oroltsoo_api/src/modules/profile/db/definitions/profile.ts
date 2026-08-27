import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

import {
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
import {
  BILL_ROLES,
  BILL_STAGES,
  MANDATE_TYPES,
  PROFILE_STATUSES,
  PROMISE_STATUSES,
  REVIEW_STATUSES,
} from '~/constants';

const socialLinksSchema = new Schema<IProfileSocialLinks>(
  {
    facebook: { type: String, label: 'Facebook' },
    twitter: { type: String, label: 'Twitter' },
    instagram: { type: String, label: 'Instagram' },
    youtube: { type: String, label: 'Youtube' },
    website: { type: String, label: 'Website' },
  },
  { _id: false },
);

const contactSchema = new Schema<IProfileContact>(
  {
    email: { type: String, label: 'Email' },
    phone: { type: String, label: 'Phone' },
    address: { type: String, label: 'Address' },
    officeHours: { type: String, label: 'Office hours' },
    socialLinks: { type: socialLinksSchema, label: 'Social links' },
  },
  { _id: false },
);

const promiseSchema = new Schema<IProfilePromise>(
  {
    title: { type: String, required: true, label: 'Promise title' },
    description: { type: String, label: 'Promise description' },
    status: {
      type: String,
      enum: PROMISE_STATUSES.ALL,
      default: PROMISE_STATUSES.PLANNED,
      label: 'Promise status',
    },
    progress: { type: Number, min: 0, max: 100, default: 0, label: 'Progress' },
  },
  { _id: false },
);

const linkSchema = new Schema<IProfileLink>(
  {
    title: { type: String, required: true, label: 'Title' },
    url: { type: String, required: true, label: 'Url' },
    publishedAt: { type: Date, label: 'Published at' },
  },
  { _id: false },
);

const billSchema = new Schema<IProfileBill>(
  {
    title: { type: String, required: true, label: 'Bill title' },
    stage: {
      type: String,
      enum: BILL_STAGES.ALL,
      default: BILL_STAGES.SUBMITTED,
      label: 'Bill stage',
    },
    role: {
      type: String,
      enum: BILL_ROLES.ALL,
      default: BILL_ROLES.SPONSOR,
      label: 'Bill role',
    },
    submittedAt: { type: Date, label: 'Submitted at' },
    url: { type: String, label: 'Bill url' },
    description: { type: String, label: 'Bill description' },
  },
  { _id: false },
);

const donationSchema = new Schema<IProfileDonation>(
  {
    donor: { type: String, required: true, label: 'Donor' },
    amount: { type: Number, min: 0, default: 0, label: 'Amount' },
    receivedAt: { type: Date, label: 'Received at' },
    url: { type: String, label: 'Source url' },
  },
  { _id: false },
);

const financeSchema = new Schema<IProfileFinance>(
  {
    assetDeclarationUrl: { type: String, label: 'Asset declaration url' },
    assetDeclarationDate: { type: Date, label: 'Asset declaration date' },
    interestDeclarationUrl: { type: String, label: 'Interest declaration url' },
    interestDeclarationDate: { type: Date, label: 'Interest declaration date' },
    campaignExpense: { type: Number, min: 0, label: 'Campaign expense' },
    campaignExpenseUrl: { type: String, label: 'Campaign expense url' },
    donations: { type: [donationSchema], default: [], label: 'Donations' },
  },
  { _id: false },
);

const attendanceSchema = new Schema<IProfileAttendance>(
  {
    periodLabel: { type: String, label: 'Period' },
    sessionAttendanceRate: {
      type: Number,
      min: 0,
      max: 100,
      label: 'Session attendance rate',
    },
    committeeAttendanceRate: {
      type: Number,
      min: 0,
      max: 100,
      label: 'Committee attendance rate',
    },
    attendedSessions: { type: Number, min: 0, label: 'Attended sessions' },
    totalSessions: { type: Number, min: 0, label: 'Total sessions' },
    sourceUrl: { type: String, label: 'Source url' },
  },
  { _id: false },
);

const educationSchema = new Schema<IProfileEducation>(
  {
    school: { type: String, required: true, label: 'School' },
    degree: { type: String, label: 'Degree' },
    field: { type: String, label: 'Field of study' },
    startYear: { type: Number, label: 'Start year' },
    endYear: { type: Number, label: 'End year' },
  },
  { _id: false },
);

const careerSchema = new Schema<IProfileCareer>(
  {
    organization: { type: String, required: true, label: 'Organization' },
    position: { type: String, required: true, label: 'Position' },
    startYear: { type: Number, label: 'Start year' },
    endYear: { type: Number, label: 'End year' },
    description: { type: String, label: 'Description' },
  },
  { _id: false },
);

export const profileSchema = new Schema<IProfileDocument>(
  {
    _id: mongooseStringRandomId,

    firstName: { type: String, label: 'First name' },
    lastName: { type: String, label: 'Last name' },
    avatar: { type: String, label: 'Avatar' },
    coverImage: { type: String, label: 'Cover image' },

    position: { type: String, label: 'Position' },
    party: { type: String, label: 'Party' },
    organization: { type: String, label: 'Organization' },
    district: { type: String, label: 'District' },
    territory: { type: String, label: 'Territory' },
    mandateType: {
      type: String,
      enum: MANDATE_TYPES.ALL,
      label: 'Mandate type',
    },
    termStart: { type: Date, label: 'Term start' },
    termEnd: { type: Date, label: 'Term end' },
    status: {
      type: String,
      enum: PROFILE_STATUSES.ALL,
      default: PROFILE_STATUSES.DRAFT,
      label: 'Status',
    },

    introduction: { type: String, label: 'Introduction' },
    positionDescription: { type: String, label: 'Position description' },
    territoryDescription: { type: String, label: 'Territory description' },

    education: { type: [educationSchema], default: [], label: 'Education' },
    career: { type: [careerSchema], default: [], label: 'Career' },

    achievements: { type: String, label: 'Achievements' },
    policyStance: { type: String, label: 'Policy stance' },
    parliamentActivity: { type: String, label: 'Parliament activity' },
    votingSummary: { type: String, label: 'Voting summary' },
    promises: { type: [promiseSchema], default: [], label: 'Promises' },
    bills: { type: [billSchema], default: [], label: 'Bills' },
    attendance: { type: attendanceSchema, label: 'Attendance' },

    feedbackNote: { type: String, label: 'Feedback note' },
    requestProcessNote: { type: String, label: 'Request process note' },

    transparencyNote: { type: String, label: 'Transparency note' },
    reports: { type: [linkSchema], default: [], label: 'Reports' },
    newsLinks: { type: [linkSchema], default: [], label: 'News links' },

    contact: { type: contactSchema, label: 'Contact' },
    finance: { type: financeSchema, label: 'Finance' },

    reviewStatus: {
      type: String,
      enum: REVIEW_STATUSES.ALL,
      default: REVIEW_STATUSES.PENDING,
      label: 'Review status',
    },
    reviewNote: { type: String, label: 'Review note' },
    reviewedAt: { type: Date, label: 'Reviewed at' },
  },
  { timestamps: true },
);

profileSchema.index({ status: 1, createdAt: -1 });
profileSchema.index({ firstName: 1, lastName: 1 });

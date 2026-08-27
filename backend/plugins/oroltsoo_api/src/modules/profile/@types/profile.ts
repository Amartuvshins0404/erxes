import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IProfileSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface IProfileContact {
  email?: string;
  phone?: string;
  address?: string;
  officeHours?: string;
  socialLinks?: IProfileSocialLinks;
}

export interface IProfilePromise {
  title: string;
  description?: string;
  status: string;
  progress: number;
}

export interface IProfileLink {
  title: string;
  url: string;
  publishedAt?: Date;
}

export interface IProfileBill {
  title: string;
  stage: string;
  role: string;
  submittedAt?: Date | null;
  url?: string;
  description?: string;
}

export interface IProfileDonation {
  donor: string;
  amount: number;
  receivedAt?: Date | null;
  url?: string;
}

export interface IProfileFinance {
  assetDeclarationUrl?: string;
  assetDeclarationDate?: Date | null;
  interestDeclarationUrl?: string;
  interestDeclarationDate?: Date | null;
  campaignExpense?: number;
  campaignExpenseUrl?: string;
  donations?: IProfileDonation[];
}

export interface IProfileAttendance {
  periodLabel?: string;
  sessionAttendanceRate?: number;
  committeeAttendanceRate?: number;
  attendedSessions?: number;
  totalSessions?: number;
  sourceUrl?: string;
}

export interface IProfileEducation {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number | null;
  endYear?: number | null;
}

export interface IProfileCareer {
  organization: string;
  position: string;
  startYear?: number | null;
  endYear?: number | null;
  description?: string;
}

export interface IProfile {
  firstName: string;
  lastName?: string;
  avatar?: string;
  coverImage?: string;

  position?: string;
  party?: string;
  organization?: string;
  district?: string;
  territory?: string;
  mandateType?: string;
  termStart?: Date;
  termEnd?: Date;
  status: string;

  introduction?: string;
  positionDescription?: string;
  territoryDescription?: string;

  education?: IProfileEducation[];
  career?: IProfileCareer[];

  achievements?: string;
  policyStance?: string;
  parliamentActivity?: string;
  votingSummary?: string;
  promises?: IProfilePromise[];
  bills?: IProfileBill[];
  attendance?: IProfileAttendance;

  feedbackNote?: string;
  requestProcessNote?: string;

  transparencyNote?: string;
  reports?: IProfileLink[];
  newsLinks?: IProfileLink[];

  contact?: IProfileContact;
  finance?: IProfileFinance;
}

export interface IProfileReview {
  reviewStatus: string;
  reviewNote?: string;
  reviewedAt?: Date | null;
}

export interface IProfileDocument extends IProfile, Document {
  _id: string;

  reviewStatus: string;
  reviewNote?: string;
  reviewedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileListParams extends ICursorPaginateParams {
  searchValue?: string;
  status?: string;
  party?: string;
  district?: string;
}

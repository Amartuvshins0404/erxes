import { IRecordTableCursorPageInfo } from 'erxes-ui';

export type ReviewStatus = 'pending' | 'verified' | 'rejected';

export type ProfileStatus = 'draft' | 'published' | 'archived';

export type PromiseStatus = 'planned' | 'inProgress' | 'done' | 'dropped';

export type MandateType = 'electorate' | 'list' | 'appointed';

export type BillStage =
  | 'submitted'
  | 'inDebate'
  | 'passed'
  | 'rejected'
  | 'withdrawn';

export type BillRole = 'sponsor' | 'coSponsor';

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
  status: PromiseStatus;
  progress: number;
}

export interface IProfileLink {
  title: string;
  url: string;
  publishedAt?: string | null;
}

export interface IProfileBill {
  title: string;
  stage: BillStage;
  role: BillRole;
  submittedAt?: string | null;
  url?: string;
  description?: string;
}

export interface IProfileDonation {
  donor: string;
  amount: number;
  receivedAt?: string | null;
  url?: string;
}

export interface IProfileFinance {
  assetDeclarationUrl?: string;
  assetDeclarationDate?: string | null;
  interestDeclarationUrl?: string;
  interestDeclarationDate?: string | null;
  campaignExpense?: number | null;
  campaignExpenseUrl?: string;
  donations?: IProfileDonation[];
  totalDonations?: number;
}

export interface IProfileAttendance {
  periodLabel?: string;
  sessionAttendanceRate?: number | null;
  committeeAttendanceRate?: number | null;
  attendedSessions?: number | null;
  totalSessions?: number | null;
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

export interface IAdminProfile {
  _id: string;
  subdomain?: string;
  entityId?: string;

  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  coverImage?: string;

  position?: string;
  party?: string;
  organization?: string;
  district?: string;
  territory?: string;
  mandateType?: MandateType | '';
  termStart?: string | null;
  termEnd?: string | null;
  status?: ProfileStatus;

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
  promiseProgress?: number;
  bills?: IProfileBill[];
  attendance?: IProfileAttendance;

  feedbackNote?: string;
  requestProcessNote?: string;

  transparencyNote?: string;
  reports?: IProfileLink[];
  newsLinks?: IProfileLink[];

  contact?: IProfileContact;
  finance?: IProfileFinance;

  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  syncedAt?: string | null;
}

export interface IAdminProfileListResponse {
  list: IAdminProfile[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
}

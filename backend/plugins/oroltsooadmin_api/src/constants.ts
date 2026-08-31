export const PROFILE_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ALL: ['draft', 'published', 'archived'],
};

export const PROMISE_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'inProgress',
  DONE: 'done',
  DROPPED: 'dropped',
  ALL: ['planned', 'inProgress', 'done', 'dropped'],
};

export const MANDATE_TYPES = {
  ELECTORATE: 'electorate',
  LIST: 'list',
  APPOINTED: 'appointed',
  ALL: ['electorate', 'list', 'appointed'],
};

export const BILL_STAGES = {
  SUBMITTED: 'submitted',
  IN_DEBATE: 'inDebate',
  PASSED: 'passed',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  ALL: ['submitted', 'inDebate', 'passed', 'rejected', 'withdrawn'],
};

export const BILL_ROLES = {
  SPONSOR: 'sponsor',
  CO_SPONSOR: 'coSponsor',
  ALL: ['sponsor', 'coSponsor'],
};

export const REVIEW_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ALL: ['pending', 'verified', 'rejected'],
};

export const POST_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ALL: ['draft', 'published', 'archived'],
};

export const MEETING_STATUSES = {
  REQUESTED: 'requested',
  PLANNED: 'planned',
  DONE: 'done',
  CANCELLED: 'cancelled',
  ALL: ['requested', 'planned', 'done', 'cancelled'],
  ADMIN_ALL: ['planned', 'done', 'cancelled'],
};

export const MEETING_SOURCES = {
  ADMIN: 'admin',
  CLIENT_PORTAL: 'clientPortal',
  ALL: ['admin', 'clientPortal'],
};

export const MEETING_REQUEST_PENDING_LIMIT = 5;

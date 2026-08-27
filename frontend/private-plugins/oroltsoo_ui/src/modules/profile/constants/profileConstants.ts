import {
  BillRole,
  BillStage,
  MandateType,
  ProfileStatus,
  PromiseStatus,
  ReviewStatus,
} from '../types/profile';

export const PROFILE_STATUS_OPTIONS: {
  value: ProfileStatus;
  label: string;
  badge: 'secondary' | 'success' | 'warning';
}[] = [
  { value: 'draft', label: 'Ноорог', badge: 'secondary' },
  { value: 'published', label: 'Нийтэлсэн', badge: 'success' },
  { value: 'archived', label: 'Архивласан', badge: 'warning' },
];

export const PROMISE_STATUS_OPTIONS: {
  value: PromiseStatus;
  label: string;
  badge: 'secondary' | 'info' | 'success' | 'destructive';
}[] = [
  { value: 'planned', label: 'Төлөвлөсөн', badge: 'secondary' },
  { value: 'inProgress', label: 'Хэрэгжиж буй', badge: 'info' },
  { value: 'done', label: 'Хэрэгжсэн', badge: 'success' },
  { value: 'dropped', label: 'Зогссон', badge: 'destructive' },
];

export const MANDATE_TYPE_OPTIONS: { value: MandateType; label: string }[] = [
  { value: 'electorate', label: 'Тойргийн' },
  { value: 'list', label: 'Жагсаалтын' },
  { value: 'appointed', label: 'Томилогдсон' },
];

export const BILL_STAGE_OPTIONS: {
  value: BillStage;
  label: string;
  badge: 'secondary' | 'info' | 'success' | 'destructive' | 'warning';
}[] = [
  { value: 'submitted', label: 'Өргөн барьсан', badge: 'secondary' },
  { value: 'inDebate', label: 'Хэлэлцэж буй', badge: 'info' },
  { value: 'passed', label: 'Батлагдсан', badge: 'success' },
  { value: 'rejected', label: 'Татгалзсан', badge: 'destructive' },
  { value: 'withdrawn', label: 'Буцаан татсан', badge: 'warning' },
];

export const BILL_ROLE_OPTIONS: { value: BillRole; label: string }[] = [
  { value: 'sponsor', label: 'Санаачлагч' },
  { value: 'coSponsor', label: 'Хамтран санаачлагч' },
];

export const REVIEW_STATUS_OPTIONS: {
  value: ReviewStatus;
  label: string;
  badge: 'warning' | 'success' | 'destructive';
}[] = [
  { value: 'pending', label: 'Хяналтад хүлээгдэж буй', badge: 'warning' },
  { value: 'verified', label: 'Баталгаажсан', badge: 'success' },
  { value: 'rejected', label: 'Татгалзсан', badge: 'destructive' },
];

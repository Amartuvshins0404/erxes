import { createSelectStatusFilter } from '@/shared/components/SelectStatusFilter';

import { REVIEW_STATUS_OPTIONS } from './profileConstants';

export const SelectReviewStatus = createSelectStatusFilter({
  queryKey: 'reviewStatus',
  options: REVIEW_STATUS_OPTIONS,
  placeholder: 'Хяналтын төлөв сонгох',
  commandId: 'review-status-command-menu',
});

import { createSelectStatusFilter } from '@/shared/components/SelectStatusFilter';

import { POST_STATUS_OPTIONS } from './postConstants';

export const SelectPostStatus = createSelectStatusFilter({
  queryKey: 'status',
  options: POST_STATUS_OPTIONS,
  placeholder: 'Төлөв сонгох',
  commandId: 'post-status-command-menu',
});

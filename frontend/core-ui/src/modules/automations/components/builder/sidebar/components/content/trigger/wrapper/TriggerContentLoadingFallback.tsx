import { Spinner } from 'erxes-ui';
import React from 'react';

export const TriggerContentLoadingFallback = React.memo(() => (
  <Spinner containerClassName="h-32" />
));

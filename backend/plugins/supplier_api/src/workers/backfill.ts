import {
  createMQWorkerWithListeners,
  redis,
  sendWorkerQueue,
} from 'erxes-api-shared/utils';
import { backfillPosCatalog } from '~/modules/platform/productSync';

const QUEUE_NAME = 'backfill';
const JOB_NAME = 'posCatalog';

export const initBackfillWorker = () => {
  createMQWorkerWithListeners(
    'supplier',
    QUEUE_NAME,
    async (job) => {
      const { subdomain, data } = job.data || {};
      const { posToken } = data || {};

      if (!subdomain || !posToken) return;

      await backfillPosCatalog(subdomain, posToken);
    },
    redis,
    () => console.log('[Worker] supplier-backfill worker ready'),
  );
};

export const enqueuePosBackfill = async (
  subdomain: string,
  posToken: string,
) => {
  if (!subdomain || !posToken) return;

  const queue = sendWorkerQueue('supplier', QUEUE_NAME);

  await queue.add(
    JOB_NAME,
    { subdomain, data: { posToken } },
    {
      jobId: `${subdomain}:${posToken}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
};

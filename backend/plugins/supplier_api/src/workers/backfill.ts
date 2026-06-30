import {
  createMQWorkerWithListeners,
  redis,
  sendWorkerQueue,
} from 'erxes-api-shared/utils';
import { backfillPosToMushop } from '~/modules/admin/productSync';

const QUEUE_NAME = 'backfill';
const JOB_NAME = 'posToMushop';

// Durable, Redis-backed worker: pushes a supplier's selected POS catalog to
// mushop. Survives restarts and retries on failure (BullMQ), so the backfill
// completes without any manual trigger even if the server bounces mid-run.
export const initBackfillWorker = () => {
  createMQWorkerWithListeners(
    'supplier',
    QUEUE_NAME,
    async (job) => {
      const { subdomain, data } = job.data || {};
      const { posToken } = data || {};

      if (!subdomain || !posToken) return;

      // Throwing propagates to BullMQ so the job is retried per its options.
      await backfillPosToMushop(subdomain, posToken);
    },
    redis,
    () => console.log('[Worker] supplier-backfill worker ready'),
  );
};

// Enqueue without blocking the caller. Retries with backoff; old jobs are
// auto-trimmed so the queue doesn't grow unbounded.
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
      // Coalesce repeated selections of the same POS into one pending job.
      jobId: `${subdomain}:${posToken}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
};

import type { Redis } from 'ioredis';
import {
  createMQWorkerWithListeners,
  sendWorkerQueue,
} from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { processPaymentReminders } from './paymentReminders';

// blockadmin_api's own storage is a single cross-org hub (rows carry their
// own `subdomain`), not a per-tenant DB, so the worker only ever needs one
// fixed subdomain to open its own model connection.
const WORKER_SUBDOMAIN = 'blockadmin';

export const runPaymentReminders = async () => {
  const models = await generateModels(WORKER_SUBDOMAIN);

  await processPaymentReminders(models);
};

export const initMQWorkers = async (redis: Redis) => {
  await sendWorkerQueue('blockadmin', 'payment-reminders').upsertJobScheduler(
    'blockadmin-daily-payment-reminders',
    { pattern: '0 9 * * *', tz: 'Asia/Ulaanbaatar' },
    { name: 'payment-reminders' },
  );

  createMQWorkerWithListeners(
    'blockadmin',
    'payment-reminders',
    runPaymentReminders,
    redis,
    () => {
      console.log('Worker for queue blockadmin-payment-reminders is ready');
    },
  );
};

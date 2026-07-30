import type { IModels } from '~/connectionResolvers';

type ScheduleSync = (models: IModels, subdomain: string) => Promise<void>;

let syncSchedules: ScheduleSync | undefined;

/** Registers the live Mastra scheduler projection after server initialization. */
export function registerScheduleSync(sync: ScheduleSync): void {
  syncSchedules = sync;
}

/** Refreshes recurrence after a product schedule or workflow changes. */
export async function syncTenantSchedules(
  models: IModels,
  subdomain: string,
): Promise<void> {
  await syncSchedules?.(models, subdomain);
}

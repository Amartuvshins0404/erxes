import { ExpectedError } from 'erxes-api-shared/utils';

const CRON_FIELD = /^[\d*/,\-A-Za-z?#]+$/;

/** Validates basic shape; Mastra remains authoritative when scheduling. */
export function validateCron(cron?: unknown): string {
  if (typeof cron !== 'string' || !cron.trim()) {
    throw new ExpectedError('Cron expression is required');
  }
  const fields = cron.trim().split(/\s+/);
  if (fields.length < 5 || fields.length > 7) {
    throw new ExpectedError(
      `Cron expression must have 5, 6, or 7 fields, got ${fields.length}`,
    );
  }
  for (const field of fields) {
    if (!CRON_FIELD.test(field)) {
      throw new ExpectedError(`Invalid cron field "${field}"`);
    }
  }
  return fields.join(' ');
}

/** Validates an IANA timezone name; blank input defaults to UTC. */
export function validateTimezone(timezone?: unknown): string {
  if (timezone == null || timezone === '') return 'UTC';
  if (typeof timezone !== 'string') throw new ExpectedError('Invalid timezone');
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
    }).resolvedOptions().timeZone;
  } catch {
    throw new ExpectedError(`Unknown timezone "${timezone}"`);
  }
}

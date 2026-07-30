import * as dotenv from 'dotenv';
import {
  AnyBulkWriteOperation,
  Collection,
  Document,
  MongoClient,
} from 'mongodb';
import { isDeepStrictEqual } from 'node:util';
import { sanitizeLogPayload } from 'erxes-api-shared/utils';

const SCRUB_BATCH_SIZE = 500;

type StoredLog = Document & {
  payload?: unknown;
};

export type CredentialLogScrubResult = {
  scanned: number;
  updated: number;
};

/**
 * Rewrites only changed payloads, so repeated runs are safe and resume cleanly
 * after an interrupted batch.
 */
export const scrubCredentialLogCollection = async (
  logs: Collection<StoredLog>,
): Promise<CredentialLogScrubResult> => {
  let scanned = 0;
  let updated = 0;
  const updates: AnyBulkWriteOperation<StoredLog>[] = [];

  const flushUpdates = async () => {
    if (updates.length === 0) {
      return;
    }

    await logs.bulkWrite(updates, { ordered: false });
    updated += updates.length;
    updates.length = 0;
  };

  const cursor = logs
    .find({}, { projection: { _id: 1, payload: 1 } })
    .batchSize(SCRUB_BATCH_SIZE);

  for await (const log of cursor) {
    scanned += 1;

    const sanitizedPayload = sanitizeLogPayload(log.payload);

    if (isDeepStrictEqual(log.payload, sanitizedPayload)) {
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: log._id },
        update: { $set: { payload: sanitizedPayload } },
      },
    });

    if (updates.length === SCRUB_BATCH_SIZE) {
      await flushUpdates();
    }
  }

  await flushUpdates();

  return { scanned, updated };
};

export const runCredentialLogScrub = async (
  mongoUrl = process.env.MONGO_URL,
): Promise<CredentialLogScrubResult> => {
  if (!mongoUrl) {
    throw new Error('MONGO_URL is required to scrub credential-bearing logs.');
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const databaseNames = (await client.db().admin().listDatabases()).databases
      .map(({ name }) => name)
      .filter((name) => name.endsWith('_logs'));

    let scanned = 0;
    let updated = 0;

    for (const databaseName of databaseNames) {
      const result = await scrubCredentialLogCollection(
        client.db(databaseName).collection<StoredLog>('logs'),
      );

      scanned += result.scanned;
      updated += result.updated;
      console.info(
        `Credential log scrub: ${databaseName} scanned=${result.scanned} updated=${result.updated}`,
      );
    }

    return { scanned, updated };
  } finally {
    await client.close();
  }
};

if (require.main === module) {
  dotenv.config();

  void runCredentialLogScrub()
    .then(({ scanned, updated }) => {
      console.info(
        `Credential log scrub complete: scanned=${scanned} updated=${updated}`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Credential log scrub failed: ${message}`);
      process.exitCode = 1;
    });
}

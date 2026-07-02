import * as dotenv from 'dotenv';

dotenv.config();

import { Collection, Db, MongoClient } from 'mongodb';
import { LOCATION_ZIP } from '@/supplier/utils/locationZip';
import { locationCode } from '@/supplier/utils/supplierCode';
import { SUPPLIER_CODE } from '~/constants';

const ZIP_SET = new Set<string>(
  Object.values(LOCATION_ZIP).flatMap((d) => Object.values(d)),
);

const splitLocation = (code: string): string | null => {
  if (!code) return null;
  const head = code.slice(0, 5);
  if (ZIP_SET.has(head)) return head; // zip path: fixed 5-digit prefix
  const m = code.match(/^(\D+)\d+$/); // fallback path: non-numeric token
  return m ? m[1] : null;
};

const { MONGO_URL = 'mongodb://localhost:27017/erxes?directConnection=true' } =
  process.env;

if (!MONGO_URL) {
  throw new Error('Environment variable MONGO_URL not set.');
}

const BATCH_SIZE = 1000;

const client = new MongoClient(MONGO_URL);

const command = async () => {
  await client.connect();

  const db: Db = client.db();
  const SUPPLIERS: Collection = db.collection('mushop_suppliers');
  const COUNTERS: Collection = db.collection('mushop_counters');

  console.log('🚀 Backfilling supplier codes...');

  const nextSeqByLocation = new Map<string, number>();

  const coded = SUPPLIERS.find(
    { code: { $exists: true, $ne: null } },
    { projection: { code: 1 } },
  );
  for await (const doc of coded) {
    const code: string = doc.code;
    const location = splitLocation(code);
    if (!location) continue;
    const seq = parseInt(code.slice(location.length), 10);
    if (!Number.isFinite(seq)) continue;
    nextSeqByLocation.set(
      location,
      Math.max(nextSeqByLocation.get(location) ?? 0, seq),
    );
  }

  // Assign codes to suppliers missing one, oldest first (lower numbers).
  const cursor = SUPPLIERS.find({
    $or: [{ code: { $exists: false } }, { code: null }],
  })
    .sort({ createdAt: 1, _id: 1 })
    .batchSize(BATCH_SIZE);

  let bulk: any[] = [];
  let assigned = 0;

  const flush = async () => {
    if (!bulk.length) return;
    await SUPPLIERS.bulkWrite(bulk, { ordered: false });
    bulk = [];
  };

  for await (const supplier of cursor) {
    const details =
      supplier?.address?.details || supplier?.address?.address || {};
    const location = locationCode(details.city, details.city_district);

    const next = (nextSeqByLocation.get(location) ?? 0) + 1;
    nextSeqByLocation.set(location, next);

    const code = `${location}${next}`;

    bulk.push({
      updateOne: {
        filter: { _id: supplier._id },
        update: { $set: { code } },
      },
    });
    assigned++;

    if (bulk.length >= BATCH_SIZE) await flush();
  }

  await flush();

  console.log(`✅ Assigned codes to ${assigned} suppliers.`);

  console.log('🚀 Seeding location counters...');
  let counterBulk: any[] = [];
  for (const [location, seq] of nextSeqByLocation.entries()) {
    counterBulk.push({
      updateOne: {
        filter: { name: `${SUPPLIER_CODE.COUNTER_PREFIX}:${location}` },
        update: { $max: { seq } },
        upsert: true,
      },
    });
  }
  if (counterBulk.length) {
    await COUNTERS.bulkWrite(counterBulk, { ordered: false });
  }
  console.log(`✅ Seeded ${counterBulk.length} location counters.`);

  console.log(`Process finished at: ${new Date().toISOString()}`);
  process.exit();
};

command();

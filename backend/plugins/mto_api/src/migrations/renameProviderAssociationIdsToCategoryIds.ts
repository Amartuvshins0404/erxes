import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/erxes?directConnection=true';

if (!MONGO_URL) {
  throw new Error('MONGO_URL not provided');
}

const client = new MongoClient(MONGO_URL);

const migrate = async () => {
  await client.connect();
  const db = client.db();
  const providers = db.collection('mto_providers');

  const result = await providers.updateMany(
    { associationIds: { $exists: true }, categoryIds: { $exists: false } },
    { $rename: { associationIds: 'categoryIds' } },
  );

  console.log(
    `Renamed associationIds → categoryIds on ${result.modifiedCount} providers`,
  );

  await client.close();
  process.exit(0);
};

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

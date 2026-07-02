import * as dotenv from 'dotenv';

dotenv.config();

import { generateModels } from '~/connectionResolvers';
import { syncCollectiveProducts } from '@/collective/utils/syncCollectiveProducts';

const { SUBDOMAIN } = process.env;

if (!SUBDOMAIN) {
  throw new Error('Environment variable SUBDOMAIN not set.');
}

const command = async () => {
  const models = await generateModels(SUBDOMAIN);

  const collectives = await models.Collective.find(
    {},
    { _id: 1, targetSubdomain: 1 },
  ).lean();

  console.log(`🚀 Re-syncing ${collectives.length} collectives into core...`);

  let ok = 0;
  let failed = 0;

  for (const collective of collectives) {
    try {
      await syncCollectiveProducts({ models, collectiveId: collective._id });
      ok++;
      console.log(`  ✅ ${collective._id} (${collective.targetSubdomain})`);
    } catch (e: any) {
      failed++;
      console.log(
        `  ❌ ${collective._id} (${collective.targetSubdomain}): ${
          e?.message || e
        }`,
      );
    }
  }

  console.log(`✅ Done. ok=${ok} failed=${failed}`);
  console.log(`Process finished at: ${new Date().toISOString()}`);
  process.exit();
};

command();

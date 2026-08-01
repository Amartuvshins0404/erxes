import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const settingsSchema = new Schema({
  _id: mongooseStringRandomId,
  erxesApiUrl: { type: String, default: 'http://localhost:4000' },
  memoryEnabled: { type: Boolean, default: true },
  // Chat attachments toggle — effective only when core upload storage exists.
  attachmentsEnabled: { type: Boolean, default: true },
});

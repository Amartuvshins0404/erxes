import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const userSettingsSchema = new Schema({
  _id: mongooseStringRandomId,
  userId: { type: String, required: true, unique: true },
  // Explicit per-user agent quota override. Unset = inherit defaultAgentQuota.
  agentQuota: { type: Number },
});

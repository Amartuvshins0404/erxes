import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const sandboxSessionSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    agentId: { type: String, required: true, index: true },
    threadId: { type: String, required: true, maxlength: 256 },
    sandboxId: { type: String },
    expiresAt: { type: Date },
    leaseId: { type: String },
    leaseExpiresAt: { type: Date },
  },
  { timestamps: true },
);

sandboxSessionSchema.index({ agentId: 1, threadId: 1 }, { unique: true });
sandboxSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

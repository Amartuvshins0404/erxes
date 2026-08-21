import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const settingsSchema = new Schema({
  _id: mongooseStringRandomId,
  erxesApiUrl: { type: String, default: 'http://localhost:4000' },
  memoryEnabled: { type: Boolean, default: true },
  // Chat attachments toggle — effective only when core upload storage exists.
  attachmentsEnabled: { type: Boolean, default: true },
  backgroundRemovalEnabled: { type: Boolean, default: true },
  // run-code sandbox backend: in-process node:vm realm or OpenSandbox container.
  sandboxMode: {
    type: String,
    enum: ['onserver', 'isolated'],
    default: 'onserver',
  },
  openSandboxApiUrl: { type: String, maxlength: 2048 },
  openSandboxApiKey: { type: String, maxlength: 512 },
});

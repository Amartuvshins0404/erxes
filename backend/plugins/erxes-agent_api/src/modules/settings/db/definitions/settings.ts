import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const settingsSchema = new Schema({
  _id: mongooseStringRandomId,
  erxesApiUrl: { type: String, default: 'http://localhost:4000' },
  memoryEnabled: { type: Boolean, default: true },
  // Chat attachments toggle — effective only when core upload storage exists.
  attachmentsEnabled: { type: Boolean, default: true },
  learningEnabled: { type: Boolean, default: false },
  learningAutoPromoteMinSources: {
    type: Number,
    default: 3,
    min: 1,
    max: 20,
  },
  learningAutoPromoteMinConfidence: {
    type: Number,
    default: 0.75,
    min: 0,
    max: 1,
  },
  learningDigestMaxChars: {
    type: Number,
    default: 2400,
    min: 500,
    max: 10000,
  },
  learningDigestMaxEntries: {
    type: Number,
    default: 12,
    min: 1,
    max: 100,
  },
  learningIdleMinutes: {
    type: Number,
    default: 30,
    min: 1,
    max: 10080,
  },
  learningDecayDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 3650,
  },
  learningDecayFactor: {
    type: Number,
    default: 0.9,
    min: 0,
    max: 1,
  },
  learningArchiveBelowConfidence: {
    type: Number,
    default: 0.2,
    min: 0,
    max: 1,
  },
  evaluationEnabled: { type: Boolean, default: false },
  // Write-only through GraphQL; runtime reads explicitly opt this field in.
  evaluationDsn: { type: String, trim: true, maxlength: 2000, select: false },
  backgroundRemovalEnabled: { type: Boolean, default: true },
  summarizerProvider: { type: String, trim: true, maxlength: 100, default: '' },
  summarizerModel: { type: String, trim: true, maxlength: 200, default: '' },
});

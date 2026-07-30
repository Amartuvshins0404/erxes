import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

// One row per artifact id; listed per thread (newest first) for the Preview
// panel's file list.
export const artifactSchema = new Schema({
  _id: mongooseStringRandomId,
  artifactId: { type: String, required: true, label: 'Artifact id' },
  threadId: { type: String, required: true, label: 'Thread id' },
  turnId: { type: String, label: 'Turn id (groups files per chat instance)' },
  prompt: { type: String, label: 'User prompt for the turn' },
  messageId: { type: String, label: 'Linked assistant message id' },
  agentId: { type: String, label: 'Agent id' },
  resourceId: { type: String, label: 'Owner resource id' },
  kind: { type: String, required: true, label: 'chart | document' },
  format: { type: String, label: 'pdf | docx | xlsx | pptx' },
  title: { type: String, default: '', label: 'Title' },
  fileName: { type: String, label: 'File name' },
  mimeType: { type: String, label: 'MIME type' },
  fileKey: { type: String, label: 'Storage key or inline URL' },
  inline: { type: Boolean, label: 'fileKey is an inline URL' },
  size: { type: Number, label: 'Bytes' },
  spec: { type: Schema.Types.Mixed, label: 'Chart spec' },
  createdAt: { type: Date, default: Date.now, label: 'Created at' },
});

artifactSchema.index({ artifactId: 1 }, { unique: true });
artifactSchema.index({ threadId: 1, createdAt: 1 });

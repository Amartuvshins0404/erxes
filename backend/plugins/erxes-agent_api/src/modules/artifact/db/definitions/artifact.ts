import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

const websiteFileSchema = new Schema(
  {
    path: { type: String, required: true, label: 'Website-relative path' },
    fileKey: { type: String, required: true, label: 'Private storage key' },
    mimeType: { type: String, required: true, label: 'MIME type' },
    size: { type: Number, required: true, label: 'Bytes' },
    sha256: { type: String, required: true, label: 'SHA-256 content digest' },
    inline: { type: Boolean, label: 'fileKey is an inline URL' },
  },
  { _id: false },
);

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
  initiatorUserId: { type: String, label: 'Initiating user id' },
  kind: {
    type: String,
    required: true,
    label: 'chart | document | diagram | image | website',
  },
  definition: { type: String, label: 'Mermaid diagram definition' },
  format: { type: String, label: 'Document format' },
  title: { type: String, default: '', label: 'Title' },
  fileName: { type: String, label: 'File name' },
  mimeType: { type: String, label: 'MIME type' },
  fileKey: { type: String, label: 'Storage key or inline URL' },
  inline: { type: Boolean, label: 'fileKey is an inline URL' },
  size: { type: Number, label: 'Bytes' },
  width: { type: Number, label: 'Image width (px)' },
  height: { type: Number, label: 'Image height (px)' },
  slides: { type: [String], label: 'Ordered pptx slide-image refs' },
  slideCount: { type: Number, label: 'Slide count' },
  entryPath: { type: String, label: 'Website entry path' },
  fileCount: { type: Number, label: 'Website file count' },
  contentHash: { type: String, label: 'Website manifest SHA-256 digest' },
  previewToken: { type: String, label: 'Website preview capability token' },
  websiteFiles: {
    type: [websiteFileSchema],
    label: 'Website member storage references',
  },
  spec: { type: Schema.Types.Mixed, label: 'Chart spec' },
  createdAt: { type: Date, default: Date.now, label: 'Created at' },
});

artifactSchema.index({ artifactId: 1 }, { unique: true });
artifactSchema.index({ threadId: 1, createdAt: 1 });
artifactSchema.index({ turnId: 1 });

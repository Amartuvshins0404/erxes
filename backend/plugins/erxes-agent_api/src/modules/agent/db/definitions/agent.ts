import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { ADDITIONAL_TOOL_KEYS } from '~/mastra/tools/additionalTools';

export const agentSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    instructions: { type: String, maxlength: 20000, label: 'Instructions' },
    provider: { type: String, required: true, label: 'Provider' },
    model: { type: String, required: true, label: 'Model' },
    createdBy: { type: String, index: true, label: 'Created By' },
    // No default: legacy profiles remain distinguishable and the access layer
    // preserves their original organization-visible behavior.
    visibility: {
      type: String,
      enum: ['private', 'shared', 'organization'],
      required: true,
      index: true,
      label: 'Visibility',
    },
    audienceUserIds: [{ type: String }],
    // Missing on legacy profiles means managed. New profiles always set this
    // explicitly in the create resolver.
    permissionMode: {
      type: String,
      enum: ['delegated', 'managed'],
      required: true,
      label: 'Permission Mode',
    },
    additionalTools: [
      {
        type: String,
        enum: ADDITIONAL_TOOL_KEYS,
      },
    ],
  },
  { timestamps: true },
);

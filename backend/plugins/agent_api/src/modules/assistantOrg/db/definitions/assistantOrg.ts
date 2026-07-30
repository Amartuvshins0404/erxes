import { Schema } from 'mongoose';

import { schemaWrapper } from 'erxes-api-shared/utils';

export const assistantOrgSchema = schemaWrapper(
  new Schema(
    {
      name: { type: String, label: 'Name', required: true },
      slug: { type: String, label: 'Slug', required: true, unique: true },
      kind: {
        type: String,
        label: 'Kind',
        required: true,
        enum: ['assistant', 'agent'],
      },
      description: { type: String, label: 'Description' },
      createdUserId: { type: String, label: 'Created user ID', index: true },
      memberIds: {
        type: [String],
        label: 'Invited member IDs',
        index: true,
        default: [],
      },
    },
    {
      timestamps: true,
    },
  ),
);

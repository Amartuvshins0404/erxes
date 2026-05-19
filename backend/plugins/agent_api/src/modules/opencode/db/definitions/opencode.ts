import { Schema } from 'mongoose';

import { schemaWrapper } from 'erxes-api-shared/utils';
import { SERVER_STATUSES } from '~/modules/agent/constants';

export const opencodeServerSchema = schemaWrapper(
  new Schema(
    {
      identifierId: { type: String, label: 'Identifier ID' },
      name: { type: String, label: 'Name' },
      url: { type: String, label: 'Url' },
      token: { type: String, label: 'Token' },
      provider: { type: String, label: 'Provider' },
      serverId: { type: String, label: 'Server ID' },
      serverPassword: { type: String, label: 'Server password' },
      status: { type: String, enum: SERVER_STATUSES.ALL, label: 'Status' },
    },
    {
      timestamps: true,
    },
  ),
);

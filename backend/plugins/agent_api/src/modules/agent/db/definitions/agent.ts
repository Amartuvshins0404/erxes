import { Schema } from 'mongoose';

import { schemaWrapper } from 'erxes-api-shared/utils';
import { SERVER_STATUSES } from '../../constants';

export const agentServerSchema = schemaWrapper(
  new Schema(
    {
      identifierId: { type: String, label: 'Identifier ID' },
      name: { type: String, label: 'Name' },
      url: { type: String, label: 'Url' },
      token: { type: String, label: 'Token' },
      approveCode: { type: String, label: 'Approve code' },

      agentId: { type: String, label: 'Agent name' },
      serverId: { type: String, label: 'Server ID' },
      transferredFromSubdomain: {
        type: String,
        label: 'Transferred from subdomain',
      },
      transferredAt: { type: Date, label: 'Transferred at' },

      status: { type: String, enum: SERVER_STATUSES.ALL, label: 'Status' },
      provisioning: {
        stage: { type: String, label: 'Provisioning stage' },
        message: { type: String, label: 'Provisioning message' },
        startedAt: { type: Date, label: 'Provisioning started at' },
        updatedAt: { type: Date, label: 'Provisioning updated at' },
        error: { type: String, label: 'Provisioning error' },
      },
    },
    {
      timestamps: true,
    },
  ),
);

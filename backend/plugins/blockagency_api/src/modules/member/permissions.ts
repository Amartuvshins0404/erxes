import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'blockagency',

  modules: [
    {
      name: 'agency',
      description: 'Agency module permissions',
      scopeField: 'agencyId',
      ownerFields: ['createdBy', 'assignedTo'],

      scopes: [
        {
          name: 'own',
          description: 'Records user created or assigned to user',
        },
        {
          name: 'group',
          description: 'Records in user teams',
        },
        { name: 'all', description: 'All records' },
      ],

      actions: [
        {
          title: 'View agency records',
          name: 'agencyRead',
          description: 'View agencies',
          always: true,
        },
        {
          title: 'Create agency records',
          name: 'agencyCreate',
          description: 'Create agencies',
        },
        {
          title: 'Edit agency records',
          name: 'agencyUpdate',
          description: 'Edit agency records',
        },
        {
          title: 'Delete agency records',
          name: 'agencyRemove',
          description: 'Delete agency records',
        },
      ],
    },
    {
      name: 'member',
      description: 'Member module permissions',
      scopeField: 'agencyId',
      ownerFields: ['createdBy'],

      scopes: [
        {
          name: 'own',
          description: 'Members created by user',
        },
        {
          name: 'group',
          description: 'Members in user teams',
        },
        { name: 'all', description: 'All members' },
      ],

      actions: [
        {
          title: 'View members',
          name: 'memberView',
          description: 'View agency members',
          always: true,
        },
        {
          title: 'Create members',
          name: 'memberCreate',
          description: 'Add agency members',
        },
        {
          title: 'Edit members',
          name: 'memberUpdate',
          description: 'Edit agency members',
        },
        {
          title: 'Delete members',
          name: 'memberRemove',
          description: 'Remove agency members',
        },
      ],
    },
  ],
  defaultGroups: [
    {
      id: 'blockagency:admin',
      name: 'Blockagency Admin',
      description: 'Full access to Blockagency plugin',
      permissions: [
        {
          plugin: 'blockagency',
          module: 'agency',
          actions: [
            'agencyRead',
            'agencyCreate',
            'agencyUpdate',
            'agencyRemove',
          ],
          scope: 'all',
        },
        {
          plugin: 'blockagency',
          module: 'member',
          actions: [
            'memberView',
            'memberCreate',
            'memberUpdate',
            'memberRemove',
          ],
          scope: 'all',
        },
      ],
    },
    {
      id: 'blockagency:agency',
      name: 'Blockagency Agent',
      description: 'Agency member with access to members only',
      permissions: [
        {
          plugin: 'blockagency',
          module: 'member',
          actions: ['memberView', 'memberCreate', 'memberUpdate'],
          scope: 'own',
        },
      ],
    },
    {
      id: 'blockagency:viewer',
      name: 'Blockagency Viewer',
      description: 'Read-only access to Blockagency plugin',
      permissions: [
        {
          plugin: 'blockagency',
          module: 'member',
          actions: ['memberView'],
          scope: 'all',
        },
      ],
    },
  ],
};

import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'block',

  modules: [
    {
      name: 'unit',
      description: 'Unit management',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All units' }],
      actions: [
        {
          title: 'View units',
          name: 'showUnits',
          description: 'View units',
          always: true,
        },
      ],
    },
    {
      name: 'project',
      description: 'Project management',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All projects' }],
      actions: [
        {
          title: 'View projects',
          name: 'showProjects',
          description: 'View projects',
          always: true,
        },
      ],
    },
  ],
};

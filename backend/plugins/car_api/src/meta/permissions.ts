import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'car',
  modules: [
    {
      name: 'car',
      description: 'Car management',
      scopeField: null,
      ownerFields: ['ownerId'],
      scopes: [
        {
          name: 'own',
          description: 'Records assigned to the current user',
        },
        {
          name: 'group',
          description: 'Records available to the current user groups',
        },
        {
          name: 'all',
          description: 'All records',
        },
      ],
      actions: [
        {
          title: 'View cars',
          name: 'showCars',
          description: 'View cars and categories',
          always: true,
        },
        {
          title: 'Manage cars',
          name: 'manageCars',
          description: 'Create, update, remove, and merge cars',
        },
      ],
    },
  ],
  defaultGroups: [
    {
      id: 'car:admin',
      name: 'Car Admin',
      description: 'Full access to the Car plugin',
      permissions: [
        {
          plugin: 'car',
          module: 'car',
          actions: ['showCars', 'manageCars'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'car:user',
      name: 'Car User',
      description: 'Standard car team member',
      permissions: [
        {
          plugin: 'car',
          module: 'car',
          actions: ['showCars', 'manageCars'],
          scope: 'group',
        },
      ],
    },
    {
      id: 'car:viewer',
      name: 'Car Viewer',
      description: 'Read-only access to cars and categories',
      permissions: [
        {
          plugin: 'car',
          module: 'car',
          actions: ['showCars'],
          scope: 'group',
        },
      ],
    },
  ],
};

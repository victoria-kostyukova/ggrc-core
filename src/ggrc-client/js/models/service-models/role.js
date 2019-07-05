/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIncludes from 'lodash/includes';
import Cacheable from '../cacheable';

export default Cacheable.extend({
  root_object: 'role',
  root_collection: 'roles',
  findAll: 'GET /api/roles',
  findOne: 'GET /api/roles/{id}',
  update: 'PUT /api/roles/{id}',
  destroy: 'DELETE /api/roles/{id}',
  create: 'POST /api/roles',
  scopes: [
    'Private Program',
    'Workflow',
    'System',
  ],
  defaults: {
    permissions: {
      read: [],
      update: [],
      create: [],
      'delete': [],
    },
  },
}, {
  allowed: function (operation, objectOrClass) {
    let cls = typeof objectOrClass === 'function' ?
      objectOrClass : objectOrClass.constructor;
    return loIncludes(this.permissions[operation], cls.model_singular);
  },
  not_system_role: function () {
    return this.attr('scope') !== 'System';
  },
  permission_summary: function () {
    let RoleList = {
      ProgramOwner: 'Program Manager',
      ProgramEditor: 'Program Editor',
      ProgramReader: 'Program Reader',
      Mapped: 'No Role',
      Owner: 'Manager',
    };
    if (RoleList[this.name]) {
      return RoleList[this.name];
    }
    return this.name;
  },
});

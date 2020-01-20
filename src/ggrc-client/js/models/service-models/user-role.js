/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'user_role',
  root_collection: 'user_roles',
  findAll: 'GET /api/user_roles',
  update: 'PUT /api/user_roles/{id}',
  create: 'POST /api/user_roles',
  destroy: 'DELETE /api/user_roles/{id}',
  attributes: {
    context: Stub,
    person: Stub,
    role: Stub,
  },
}, {});

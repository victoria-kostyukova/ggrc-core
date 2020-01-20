/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'context',
  root_collection: 'contexts',
  category: 'contexts',
  findAll: '/api/contexts',
  findOne: '/api/contexts/{id}',
  create: 'POST /api/contexts',
  update: 'PUT /api/contexts/{id}',
  destroy: 'DELETE /api/contexts/{id}',
  attributes: {
    context: Stub,
    related_object: Stub,
    user_roles: Stub.List,
  },
}, {});

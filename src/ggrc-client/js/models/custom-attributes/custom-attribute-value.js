/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'custom_attribute_value',
  root_collection: 'custom_attribute_values',
  category: 'custom_attribute_values',
  findAll: 'GET /api/custom_attribute_values',
  findOne: 'GET /api/custom_attribute_values/{id}',
  create: 'POST /api/custom_attribute_values',
  update: 'PUT /api/custom_attribute_values/{id}',
  destroy: 'DELETE /api/custom_attribute_values/{id}',
  attributes: {
    modified_by: Stub,
  },
}, {});

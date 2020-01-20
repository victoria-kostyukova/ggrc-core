/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'external_custom_attribute_definition',
  root_collection: 'external_custom_attribute_definitions',
  category: 'external_custom_attribute_definitions',
  findAll: 'GET /api/external_custom_attribute_definitions',
  attributes: {
    modified_by: Stub,
  },
}, {});

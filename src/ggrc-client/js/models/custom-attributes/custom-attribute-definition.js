/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'custom_attribute_definition',
  root_collection: 'custom_attribute_definitions',
  category: 'custom_attribute_definitions',
  findAll: 'GET /api/custom_attribute_definitions',
  findOne: 'GET /api/custom_attribute_definitions/{id}',
  create: 'POST /api/custom_attribute_definitions',
  update: 'PUT /api/custom_attribute_definitions/{id}',
  destroy: 'DELETE /api/custom_attribute_definitions/{id}',
  attributes: {
    modified_by: Stub,
  },
  defaults: {
    title: '',
    attribute_type: 'Text',
  },
}, {
  define: {
    title: {
      value: '',
      validate: {
        required: true,
        validateOnExcludedSymbols: true,
      },
    },
    // Besides multi_choice_options we need toset the validation on the
    // attribute_type field as well, even though its validation always
    // succeeds. For some reson this is required for the modal UI buttons to
    // properly update themselves when choosing a different attribute type.
    multi_choice_options: {
      value: '',
      validate: {
        validateMultiChoiceOptions: true,
      },
    },
    attribute_type: {
      validate: {
        validateMultiChoiceOptions: true,
      },
    },
    excludedSymbols: {
      value: '*',
    },
  },
});

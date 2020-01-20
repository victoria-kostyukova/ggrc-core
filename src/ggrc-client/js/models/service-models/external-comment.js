/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cacheable from '../cacheable';

export default Cacheable.extend({
  root_object: 'external_comment',
  root_collection: 'external_comments',
  findOne: 'GET /api/external_comments/{id}',
  findAll: 'GET /api/external_comments',
  update: 'PUT /api/external_comments/{id}',
  destroy: 'DELETE /api/external_comments/{id}',
  create: 'POST /api/external_comments',
}, {
  display_type() {
    return 'Comment';
  },
  display_name() {
    return this.description || '';
  },
});

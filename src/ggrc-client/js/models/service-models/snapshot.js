/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'snapshot',
  root_collection: 'snapshots',
  attributes: {
    context: Stub,
    modified_by: Stub,
    parent: Stub,
  },
  defaults: {
    parent: null,
    revision: null,
  },
  findAll: 'GET /api/snapshots',
  update: 'PUT /api/snapshots/{id}',
  destroy: 'DELETE /api/snapshots/{id}',
}, {
  display_name: function () {
    if (!this.revision) {
      // temp solution till the bug GGRC-4839 is fixed
      console
        .error(`Revision is not defined for snapshot with ID: ${this.id}!`);
      return;
    }
    return this.revision.content.title;
  },
  display_type: function () {
    if (!this.revision) {
      // temp solution till the bug GGRC-4839 is fixed
      console
        .error(`Revision is not defined for snapshot with ID: ${this.id}!`);
      return;
    }
    return this._super.call(this.revision.content);
  },
});

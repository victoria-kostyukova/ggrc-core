/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import IsOverdue from '../mixins/is-overdue';
import Stub from '../stub';
import Contactable from '../mixins/contactable';
import pubSub from '../../pub-sub';

export default Cacheable.extend({
  root_object: 'cycle_task_group',
  root_collection: 'cycle_task_groups',
  category: 'workflow',
  findAll: 'GET /api/cycle_task_groups',
  findOne: 'GET /api/cycle_task_groups/{id}',
  create: 'POST /api/cycle_task_groups',
  update: 'PUT /api/cycle_task_groups/{id}',
  destroy: 'DELETE /api/cycle_task_groups/{id}',
  mixins: [IsOverdue, Contactable],
  attributes: {
    cycle: Stub,
    task_group: Stub,
    cycle_task_group_tasks: Stub.List,
    modified_by: Stub,
    context: Stub,
  },
  init: function () {
    if (this._super) {
      this._super(...arguments);
    }
    pubSub.dispatch('createdCycleTaskGroup');
  },
}, {
  define: {
    title: {
      value: '',
      validate: {
        required: true,
      },
    },
    contact: {
      validate: {
        required: true,
      },
    },
    cycle: {
      validate: {
        required: true,
      },
    },
  },
});

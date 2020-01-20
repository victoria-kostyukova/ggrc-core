/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cacheable from '../cacheable';
import Contactable from '../mixins/contactable';
import Stub from '../stub';
import {refreshAll} from '../../models/refresh-queue';

export default Cacheable.extend({
  root_object: 'task_group',
  root_collection: 'task_groups',
  category: 'workflow',
  findAll: 'GET /api/task_groups',
  findOne: 'GET /api/task_groups/{id}',
  create: 'POST /api/task_groups',
  update: 'PUT /api/task_groups/{id}',
  destroy: 'DELETE /api/task_groups/{id}',
  mixins: [Contactable],
  attributes: {
    workflow: Stub,
    modified_by: Stub,
    context: Stub,
  },

  tree_view_options: {
    add_item_view: 'task_groups/tree-add-item',
    attr_list: [
      {attr_title: 'Title', attr_name: 'title'},
      {attr_title: 'Assignee', attr_name: 'assignee',
        attr_sort_field: 'contact'},
      {attr_title: 'Description', attr_name: 'description'},
    ],
    disable_columns_configuration: true,
  },

  init: function () {
    let that = this;
    if (this._super) {
      this._super(...arguments);
    }

    this.bind('updated', function (ev, instance) {
      if (instance instanceof that) {
        refreshAll(instance, ['workflow', 'context'], true);
      }
    });
    this.bind('destroyed', function (ev, inst) {
      if (inst instanceof that) {
        refreshAll(inst, ['workflow', 'context'], true);
      }
    });
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
    workflow: {
      validate: {
        required: true,
      },
    },
  },
});

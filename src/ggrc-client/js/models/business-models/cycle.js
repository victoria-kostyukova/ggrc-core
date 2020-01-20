/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import {refreshPermissions} from '../../permission';
import IsOverdue from '../mixins/is-overdue';
import Stub from '../stub';
import Workflow from './workflow';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {REFRESH_MAPPING} from '../../events/event-types';

function refreshWorkflow(ev, instance) {
  if (instance instanceof this === false) {
    return;
  }

  refreshPermissions();

  const workflowId = instance.attr('workflow.id');
  const model = Workflow.findInCacheById(workflowId);

  if (model.selfLink) {
    model.refresh();
  }
}

export default Cacheable.extend({
  root_object: 'cycle',
  root_collection: 'cycles',
  category: 'workflow',
  findAll: 'GET /api/cycles',
  findOne: 'GET /api/cycles/{id}',
  create: 'POST /api/cycles',
  update: 'PUT /api/cycles/{id}',
  destroy: 'DELETE /api/cycles/{id}',
  mixins: [IsOverdue],
  attributes: {
    workflow: Stub,
    modified_by: Stub,
    context: Stub,
  },
  defaults: {
    title: '',
  },
  tree_view_options: {
    attr_list: [{
      attr_title: 'Title',
      attr_name: 'title',
      order: 10,
    }, {
      attr_title: 'State',
      attr_name: 'status',
      order: 15,
    }, {
      attr_title: 'End Date',
      attr_name: 'end_date',
      order: 20,
    }],
    mandatory_attr_name: ['title', 'status', 'end_date'],
    disable_columns_configuration: true,
  },
  init: function () {
    this._super(...arguments);
    this.bind('created', refreshWorkflow.bind(this));
  },
}, {
  init: function () {
    this._super(...arguments);
    this.bind('status', function (ev, newStatus, oldStatus) {
      if (newStatus === 'Deprecated' || oldStatus === 'Deprecated') {
        getPageInstance().dispatch({
          type: `${REFRESH_MAPPING.type}`,
          destinationType: this.type,
        });
      }
    });
  },
});

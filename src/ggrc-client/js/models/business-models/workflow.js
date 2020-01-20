/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import TaskGroup from './task-group';
import CaUpdate from '../mixins/ca-update';
import AccessControlList from '../mixins/access-control-list';
import Stub from '../stub';

export default Cacheable.extend({
  root_object: 'workflow',
  root_collection: 'workflows',
  category: 'workflow',
  mixins: [CaUpdate, AccessControlList],
  findAll: 'GET /api/workflows',
  findOne: 'GET /api/workflows/{id}',
  create: 'POST /api/workflows',
  update: 'PUT /api/workflows/{id}',
  destroy: 'DELETE /api/workflows/{id}',
  is_custom_attributable: true,
  attributes: {
    task_groups: Stub.List,
    cycles: Stub.List,
    modified_by: Stub,
    context: Stub,
  },
  default_lhn_filters: {
    Workflow: {status: 'Active'},
    Workflow_All: {},
    Workflow_Active: {status: 'Active'},
    Workflow_Inactive: {status: 'Inactive'},
    Workflow_Draft: {status: 'Draft'},
  },
  defaults: {
    task_group_title: 'Task Group 1',
    is_verification_needed: false,
  },
  obj_nav_options: {
    show_all_tabs: true,
  },
  tree_view_options: {
    attr_list: [
      {attr_title: 'Title', attr_name: 'title'},
      {attr_title: 'Code', attr_name: 'slug'},
      {attr_title: 'State', attr_name: 'status'},
      {attr_title: 'Last Updated Date', attr_name: 'updated_at'},
      {attr_title: 'Last Updated By', attr_name: 'modified_by'},
      {attr_title: 'Repeat', attr_name: 'repeat'},
      {
        attr_title: 'Description',
        attr_name: 'description',
      }],
    display_attr_names: ['title', 'status', 'updated_at', 'Admin',
      'Workflow Member'],
  },
}, {
  define: {
    title: {
      value: '',
      validate: {
        required: true,
      },
    },
    repeat_every: {
      type: 'number',
    },
  },
  /**
   * Saves or updates workflow
   * @param {Boolean} createDefaultTaskGroup if set to true default TaskGroup
   *                                         is created after workflow saving
   * @return {$.Deferred}
  **/
  save: function (createDefaultTaskGroup = true) {
    const dfd = new $.Deferred();
    let taskGroupTitle = this.task_group_title;
    let isNew = this.isNew();
    let redirectLink;
    let taskGroup;

    this._super(...arguments)
      .then((instance) => {
        redirectLink = `${instance.viewLink}#task_group`;
        instance.attr('_redirect', redirectLink);
        if (!createDefaultTaskGroup || !taskGroupTitle ||
          !isNew || instance.clone) {
          dfd.resolve(instance);
          // skip next 'then' chain
          return $.Deferred().reject();
        }
        taskGroup = new TaskGroup({
          title: taskGroupTitle,
          workflow: instance,
          contact: instance.modified_by,
          context: instance.context,
        });
        return taskGroup.save();
      })
      .then(() => {
        dfd.resolve(this);
      })
      .fail(dfd.reject);

    return dfd;
  },
});


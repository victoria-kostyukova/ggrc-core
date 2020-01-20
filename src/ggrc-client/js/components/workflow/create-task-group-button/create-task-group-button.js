/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {refreshTGRelatedItems} from '../../../plugins/utils/workflow-utils';
import {isAllowedFor} from '../../../permission';

const viewModel = canMap.extend({
  define: {
    showCreateButton: {
      get() {
        const workflow = this.attr('workflow');
        return (
          isAllowedFor('update', workflow) &&
          workflow.attr('status') !== 'Inactive'
        );
      },
    },
  },
  workflow: null,
  needToUpdateRelatedItems: false,
  lastAddedTaskGroup: null,
  refreshRelatedItems(taskGroup) {
    refreshTGRelatedItems(taskGroup);
    this.attr('lastAddedTaskGroup', null);
  },
  tryToRefreshRelatedItems() {
    const taskGroup = this.attr('lastAddedTaskGroup');
    const hasNotUpdatedItems = this.attr('lastAddedTaskGroup') !== null;

    if (hasNotUpdatedItems) {
      this.refreshRelatedItems(taskGroup);
    }
  },
});

const events = {
  '[data-toggle="modal-ajax-form"] modal:success'(el, ev, createdTaskGroup) {
    this.viewModel.refreshRelatedItems(createdTaskGroup);
  },
  '[data-toggle="modal-ajax-form"] modal:added'(el, ev, createdTaskGroup) {
    this.viewModel.attr('lastAddedTaskGroup', createdTaskGroup);
  },
  '[data-toggle="modal-ajax-form"] modal:dismiss'() {
    this.viewModel.tryToRefreshRelatedItems();
  },
};

export default canComponent.extend({
  tag: 'create-task-group-button',
  leakScope: true,
  viewModel,
  events,
});

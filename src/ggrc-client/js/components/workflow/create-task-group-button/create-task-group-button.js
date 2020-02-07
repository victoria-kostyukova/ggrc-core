/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {refreshTGRelatedItems} from '../../../plugins/utils/workflow-utils';
import {isAllowedFor} from '../../../permission';

const ViewModel = canDefineMap.extend({
  workflow: {
    value: null,
  },
  needToUpdateRelatedItems: {
    value: false,
  },
  lastAddedTaskGroup: {
    value: null,
  },
  showCreateButton: {
    get() {
      const workflow = this.workflow;
      return (
        isAllowedFor('update', workflow) &&
        workflow.attr('status') !== 'Inactive'
      );
    },
  },
  refreshRelatedItems(taskGroup) {
    refreshTGRelatedItems(taskGroup);
    this.lastAddedTaskGroup = null;
  },
  tryToRefreshRelatedItems() {
    const taskGroup = this.lastAddedTaskGroup;
    const hasNotUpdatedItems = this.lastAddedTaskGroup !== null;

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
    this.viewModel.lastAddedTaskGroup = createdTaskGroup;
  },
  '[data-toggle="modal-ajax-form"] modal:dismiss'() {
    this.viewModel.tryToRefreshRelatedItems();
  },
};

export default canComponent.extend({
  tag: 'create-task-group-button',
  leakScope: true,
  ViewModel,
  events,
});

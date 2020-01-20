/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../info-pin-buttons/info-pin-buttons';
import '../task-group-clone';
import '../task-list/task-list';
import '../task-group-objects/task-group-objects';
import template from './templates/task-group.stache';
import {isAllowedFor} from '../../../permission';
import {refreshAll} from '../../../models/refresh-queue';

const viewModel = canMap.extend({
  define: {
    canEdit: {
      get() {
        return (
          isAllowedFor('update', this.attr('instance')) &&
          this.attr('workflow.status') !== 'Inactive'
        );
      },
    },
  },
  instance: null,
  workflow: null,
  async loadWorkflow() {
    const instance = this.attr('instance');
    const workflow = await refreshAll(instance, ['workflow']);
    this.attr('workflow', workflow);
  },
});


const init = function () {
  this.viewModel.loadWorkflow();
};

export default canComponent.extend({
  tag: 'task-group',
  view: canStache(template),
  leakScope: true,
  viewModel,
  init,
});

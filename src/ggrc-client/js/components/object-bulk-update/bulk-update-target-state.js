/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './bulk-update-target-state.stache';

let objectStateToWarningMap = {
  CycleTaskGroupObjectTask: {
    'In Progress': 'Please be aware that Finished, Declined and Verified ' +
      'tasks cannot be moved to In Progress state.',
    Finished: 'Please be aware that Assigned and Verified ' +
      'tasks cannot be moved to Finished state.',
    Declined: 'Please be aware that Assigned, In Progress and Verified ' +
      'tasks cannot be moved to Declined state.',
    Verified: 'Please be aware that Assigned, In Progress and Declined ' +
      'tasks cannot be moved to Verified state.',
  },
};

export default canComponent.extend({
  tag: 'bulk-update-target-state',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      warningMessage: {
        get: function () {
          let model = this.attr('modelName');
          let targetState = this.attr('targetState');
          return objectStateToWarningMap[model]
            && objectStateToWarningMap[model][targetState]
            || '';
        },
      },
    },
    modelName: null,
    targetState: null,
    targetStates: [],
    enabled: false,
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../custom-attributes/custom-attributes-actions';
import '../../object-state-toolbar/object-state-toolbar';
import template from './assessment-controls-toolbar.stache';

export default canComponent.extend({
  tag: 'assessment-controls-toolbar',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    verifiers: [],
    isInfoPaneSaving: false,
    isUndoButtonVisible: false,
    currentState: '',
    onStateChange: function (event) {
      this.dispatch({
        type: 'onStateChange',
        state: event.state,
        undo: event.undo,
      });
    },
  }),
});

/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
let viewModel = canMap.extend({
  toState: '',
  changeState: function (newState) {
    this.dispatch({
      type: 'onStateChange',
      state: newState,
    });
  },
});

let events = {
  click: function (element, event) {
    let newState = this.viewModel.attr('toState');
    this.viewModel.changeState(newState);
    event.preventDefault();
  },
};

export default canComponent.extend({
  tag: 'object-change-state',
  leakScope: true,
  viewModel,
  events,
});

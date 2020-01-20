/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
/* Default Sate for Assessment should be 'Not Started' */
const defaultState = 'Not Started';

/**
 * canMap(ViewModel) presenting behavior of State Colors Map Component
 * @type {canMap}
 */
let viewModel = canMap.extend({
  define: {
    state: {
      type: 'string',
      value: defaultState,
    },
    suffix: {
      get: function () {
        let state = this.attr('state') || defaultState;
        return state.toLowerCase().replace(/[\s\t]+/g, '');
      },
    },
    verified: {
      get: function (value) {
        return value ? 'verified' : '';
      },
    },
  },
});
/**
 * Simple Component to add color indication for Assessment State Name
 */
export default canComponent.extend({
  tag: 'state-colors-map',
  view: canStache(
    '<span class="state-value-dot state-{{suffix}} {{verified}}">' +
    '{{state}}</span>'
  ),
  leakScope: true,
  viewModel,
});

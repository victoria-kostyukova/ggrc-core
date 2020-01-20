/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './collapsible-panel-header.stache';

/**
 * Collapsible Panel component to add collapsing behavior
 */
export default canComponent.extend({
  tag: 'collapsible-panel-header',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    titleIcon: null,
    expanded: null,
    toggle: function () {
      this.attr('expanded', !this.attr('expanded'));
    },
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './collapsible-panel-body.stache';

/**
 * Collapsible Panel component to add collapsing behavior
 */
export default canComponent.extend({
  tag: 'collapsible-panel-body',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    renderContent: function () {
      return this.attr('softMode') || this.attr('expanded');
    },
    softMode: false,
    expanded: null,
  }),
});

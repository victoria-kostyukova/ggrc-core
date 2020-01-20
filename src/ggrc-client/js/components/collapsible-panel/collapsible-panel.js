/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './collapsible-panel-header';
import './collapsible-panel-body';
import template from './collapsible-panel.stache';

let viewModel = canMap.extend({
  titleText: '',
  titleIcon: '',
  extraCssClass: '',
  softMode: false,
  define: {
    /**
     * Public attribute to indicate expanded/collapsed status of the component
     * @type {Boolean}
     * @public
     */
    expanded: {
      type: 'boolean',
      value: false,
    },
  },
});
/**
 * Collapsible Panel component to add expand/collapse behavior
 */
export default canComponent.extend({
  tag: 'collapsible-panel',
  view: canStache(template),
  leakScope: false,
  viewModel,
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './inner-nav-collapse.stache';

export default canComponent.extend({
  tag: 'inner-nav-collapse',
  leakScope: false,
  view: canStache(template),
  viewModel: canMap.extend({
    title: null,
    expanded: true,
    toggle() {
      let expanded = this.attr('expanded');
      this.attr('expanded', !expanded);
    },
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/mapper-results-item-status.stache';

export default canComponent.extend({
  tag: 'mapper-results-item-status',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    itemData: {},
  }),
});

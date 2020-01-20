/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './info-pane-footer.stache';

/**
 * Specific Info Pane Footer Component
 */
export default canComponent.extend({
  tag: 'info-pane-footer',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    createdAt: '',
    modifiedAt: '',
    modifiedBy: {},
  }),
});

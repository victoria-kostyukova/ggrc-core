/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './date-form-field-view.stache';

export default canComponent.extend({
  tag: 'date-form-field-view',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    value: null,
    disabled: false,
  }),
});

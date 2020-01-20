/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../dropdown/dropdown-component';
import '../numberbox/numberbox-component';
import template from './templates/modal-issue-tracker-config-fields.stache';

export default canComponent.extend({
  tag: 'modal-issue-tracker-config-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
  }),
});

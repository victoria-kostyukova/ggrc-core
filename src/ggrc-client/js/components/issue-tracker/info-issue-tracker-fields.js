/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/info-issue-tracker-fields.stache';

export default canComponent.extend({
  tag: 'info-issue-tracker-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    showTitle: false,
    note: '',
    linkingNote: '',
    snowId: false,
  }),
});

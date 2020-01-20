/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './custom-attributes-actions.stache';

export default canComponent.extend({
  tag: 'custom-attributes-actions',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    formEditMode: false,
    disabled: false,
    edit: function () {
      this.attr('formEditMode', true);
    },
  }),
});

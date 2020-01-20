/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../../numberbox/numberbox-component';
import template from './templates/numberbox-form-field.stache';
import {TEXT_FORM_FIELD_VM} from './text-form-field';

export default canComponent.extend({
  tag: 'numberbox-form-field',
  view: canStache(template),
  leakScope: true,
  viewModel: TEXT_FORM_FIELD_VM,
  events: {
    inserted() {
      this.viewModel.attr('textField', this.element.find('.text-field'));
    },
  },
});

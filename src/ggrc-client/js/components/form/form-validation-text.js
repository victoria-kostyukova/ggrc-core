/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
const textMap = {
  input: 'This field is required.',
  checkbox: 'This checkbox is required.',
  dropdownNoInfo: 'Add required info by click on the link.',
};

/**
 * Form validation text component
 */
export default canComponent.extend({
  tag: 'form-validation-text',
  view: canStache('<p class="required">{{text}}</p>'),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      text: {
        type: String,
        validation: {},
        value: 'This field is required.',
        get: function () {
          let text;

          switch (this.attr('type')) {
            case 'dropdown':
              text = this.attr('validation.hasMissingInfo') ?
                textMap.dropdownNoInfo : textMap.input;
              break;

            case 'checkbox':
              text = textMap.checkbox;
              break;

            default:
              text = textMap.input;
              break;
          }
          return text;
        },
      },
    },
    validation: {},
    highlightInvalidFields: '',
    type: 'input',
  }),
});

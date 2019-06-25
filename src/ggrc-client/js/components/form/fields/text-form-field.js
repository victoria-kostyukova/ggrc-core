/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loTrim from 'lodash/trim';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/text-form-field.stache';

const TEXT_FORM_FIELD_VM = canMap.extend({
  define: {
    inputValue: {
      set(newValue) {
        let _value = this.attr('_value');
        if (_value === newValue ||
          newValue.length && !loTrim(newValue).length) {
          return;
        }

        this.attr('_value', newValue);
        this.valueChanged(newValue);
      },
      get() {
        return this.attr('_value');
      },
    },
    value: {
      set(newValue) {
        if (!this.isAllowToSet()) {
          return;
        }

        this.attr('_value', newValue);
      },
      get() {
        return this.attr('_value');
      },
    },
  },
  fieldId: null,
  placeholder: '',
  _value: '',
  textField: null,
  isAllowToSet() {
    let textField = this.attr('textField');

    if (!textField) {
      return true;
    }

    let isFocus = textField.is(':focus');
    let isEqualValues = textField.val() === this.attr('_value');

    return !isFocus || isEqualValues;
  },
  valueChanged(newValue) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: this.fieldId,
      value: newValue,
    });
  },
});

export default canComponent.extend({
  view: canStache(template),
  tag: 'text-form-field',
  leakScope: true,
  viewModel: TEXT_FORM_FIELD_VM,
  events: {
    inserted() {
      this.viewModel.attr('textField', this.element.find('.text-field'));
    },
  },
});

export {TEXT_FORM_FIELD_VM};

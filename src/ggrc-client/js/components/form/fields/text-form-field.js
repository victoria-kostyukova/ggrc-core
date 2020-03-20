/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/text-form-field.stache';

const TEXT_FORM_FIELD_VM = canDefineMap.extend({
  inputValue: {
    set(newValue) {
      let _value = this._value;
      if (_value === newValue ||
        newValue.length && !newValue.trim().length) {
        return;
      }

      this._value = newValue;
      this.valueChanged(newValue);
    },
    get() {
      return this._value;
    },
  },
  value: {
    set(newValue) {
      if (!this.isAllowToSet()) {
        return;
      }

      this._value = newValue;
    },
    get() {
      return this._value;
    },
  },
  fieldId: {
    value: null,
  },
  placeholder: {
    value: '',
  },
  _value: {
    value: '',
  },
  textField: {
    value: null,
  },
  isAllowToSet() {
    let textField = this.textField;

    if (!textField) {
      return true;
    }

    let isFocus = textField.is(':focus');
    let isEqualValues = textField.val() === this._value;

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
  ViewModel: TEXT_FORM_FIELD_VM,
  events: {
    inserted() {
      this.viewModel.textField = this.element.find('.text-field');
    },
  },
});

export {TEXT_FORM_FIELD_VM};

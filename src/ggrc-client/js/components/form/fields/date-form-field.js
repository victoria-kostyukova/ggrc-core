/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../../datepicker/datepicker-component';
import template from './date-form-field.stache';

const ViewModel = canDefineMap.extend({
  inputValue: {
    set(newValue) {
      let oldValue = this._value;

      if (newValue === oldValue) {
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
      this._value = newValue;
    },
    get() {
      return this._value;
    },
  },
  _value: {
    value: null,
  },
  fieldId: {
    value: null,
  },
  readonly: {
    value: true,
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
  tag: 'date-form-field',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

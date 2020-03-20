/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './checkbox-form-field.stache';

const ViewModel = canDefineMap.extend({
  inputValue: {
    set(newValue) {
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
    value: false,
  },
  fieldId: {
    value: null,
  },
  valueChanged: function (newValue) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: this.fieldId,
      value: newValue,
    });
  },
});

export default canComponent.extend({
  tag: 'checkbox-form-field',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

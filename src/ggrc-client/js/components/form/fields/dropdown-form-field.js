/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../../dropdown/dropdown-component';
import '../../dropdown/dropdown-wrap-text';
import template from './dropdown-form-field.stache';

const ViewModel = canDefineMap.extend({
  isNoneSelected: {
    get() {
      return this.value === null && this.disabled;
    },
  },
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
  fieldId: {
    type: 'number',
    value: null,
  },
  isLocalCa: {
    value: false,
  },
  _value: {
    value: '',
  },
  options: {
    value: () => [],
  },
  isGroupedDropdown: {
    value: false,
  },
  dropdownOptionsGroups: {
    value: () => ({}),
  },
  noValue: {
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
  tag: 'dropdown-form-field',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

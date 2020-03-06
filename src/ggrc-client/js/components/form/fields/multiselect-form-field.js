/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './multiselect-form-field.stache';
import '../../dropdown/multiselect-dropdown';

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
  options: {
    set(newValue) {
      this._options = newValue;
    },
    get() {
      const selected = this._value.split(',');
      return loMap(this._options, (item) => {
        return {value: item, checked: selected.includes(item)};
      });
    },
  },
  _value: {
    value: '',
  },
  _options: {
    value: () => [],
  },
  dropdownOptions: {
    value: () => [],
  },
  fieldId: {
    value: null,
  },
  isInlineMode: {
    value: false,
  },
  valueChanged(newValue) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: this.fieldId,
      value: newValue.selected.map((item) => item.value).join(','),
    });
  },
});

export default canComponent.extend({
  tag: 'multiselect-form-field',
  view: canStache(template),
  ViewModel,
  events: {
    // use dropdownOptions attr to prevent unnecessary
    // update options from parent to child component
    // after changing option checked state
    inserted() {
      const options = this.viewModel.options;
      this.viewModel.dropdownOptions = options;
    },
  },
});

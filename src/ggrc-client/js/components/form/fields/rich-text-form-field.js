/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../../rich-text/rich-text';
import template from './rich-text-form-field.stache';

const ViewModel = canDefineMap.extend({
  _value: {
    value: '',
  },
  _oldValue: {
    value: null,
  },
  placeholder: {
    value: '',
  },
  editorHasFocus: {
    value: false,
  },
  value: {
    set(newValue) {
      if (newValue !== null && this.isAllowToSet(newValue)) {
        this._oldValue = newValue;
        this._value = newValue;
      }
    },
    get() {
      return this._value;
    },
  },
  inputValue: {
    get() {
      return this._value;
    },
  },
  fieldId: {
    value: null,
  },
  isAllowToSet() {
    let isFocus = this.editorHasFocus;
    let isEqualValues = this._value === this._oldValue;

    return !isFocus || isEqualValues;
  },
  checkValueChanged: function () {
    let newValue = this._value;
    let oldValue = this._oldValue;
    if (newValue !== oldValue) {
      this._oldValue = newValue;
      this.valueChanged(newValue);
    }
  },
  valueChanged: function (newValue) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: this.fieldId,
      value: newValue,
    });
  },
  onBlur: function () {
    this.checkValueChanged();
  },
  updateRichTextValue(ev) {
    const newValue = ev.newValue;
    const oldValue = this._oldValue;
    if (newValue === oldValue ||
        newValue.length && !newValue.trim().length) {
      return;
    }

    this._value = newValue;

    setTimeout(function () {
      this.checkValueChanged();
    }.bind(this), 5000);
  },
});

export default canComponent.extend({
  tag: 'rich-text-form-field',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '.ql-editor blur': function () {
      this.viewModel.onBlur();
    },
  },
});

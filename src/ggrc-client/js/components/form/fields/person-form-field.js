/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../person/person-data';
import template from './person-form-field.stache';

export default canComponent.extend({
  tag: 'person-form-field',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      inputValue: {
        set(newValue) {
          let oldValue = this.attr('_value');
          if (oldValue === newValue) {
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
          this.attr('_value', newValue);
        },
        get() {
          return this.attr('_value');
        },
      },
      fieldId: {
        type: 'number',
      },
    },
    _value: null,
    setPerson: function (ev) {
      this.attr('inputValue', ev.selectedItem.serialize().id);
    },
    unsetPerson: function (scope, el, ev) {
      ev.preventDefault();
      this.attr('inputValue', null);
    },
    valueChanged: function (newValue) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: this.attr('fieldId'),
        value: newValue,
      });
    },
  }),
});

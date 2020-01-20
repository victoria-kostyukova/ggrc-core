/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../form/form-validation-icon';
import '../form/form-validation-text';
import '../custom-attributes/custom-attributes-field-view';
import template from './custom-attributes.stache';
import isFunction from 'can-util/js/is-function/is-function';

export default canComponent.extend({
  tag: 'custom-attributes',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    isLocalCa: false,
    fields: [],
    editMode: false,
    fieldValueChanged: function (e, field) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: e.fieldId,
        value: e.value,
        field,
      });
    },
    addRequiredInfo(e, field) {
      this.dispatch({
        type: 'addRequiredInfo',
        field,
      });
    },
  }),
  helpers: {
    isInvalidField(show, valid, highlightInvalidFields, options) {
      show = isFunction(show) ? show() : show;
      valid = isFunction(valid) ? valid() : valid;
      highlightInvalidFields = isFunction(highlightInvalidFields) ?
        highlightInvalidFields() : highlightInvalidFields;

      if (highlightInvalidFields && show && !valid) {
        return options.fn(options.context);
      }
      return options.inverse(options.context);
    },
  },
});

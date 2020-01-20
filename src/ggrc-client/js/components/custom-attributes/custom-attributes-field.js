/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../form/fields/checkbox-form-field';
import '../form/fields/multiselect-form-field';
import '../form/fields/date-form-field';
import '../form/fields/dropdown-form-field';
import '../form/fields/person-form-field';
import '../form/fields/rich-text-form-field';
import '../form/fields/text-form-field';
import template from './custom-attributes-field.stache';

export default canComponent.extend({
  tag: 'custom-attributes-field',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      disabled: {
        type: 'htmlbool',
      },
    },
    type: null,
    value: null,
    fieldId: null,
    placeholder: '',
    options: [],
    isLocalCa: false,
    fieldValueChanged: function (e, scope) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: e.fieldId,
        value: e.value,
        field: scope,
      });
    },
  }),
});

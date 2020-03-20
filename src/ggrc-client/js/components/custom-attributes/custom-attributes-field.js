/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../form/fields/checkbox-form-field';
import '../form/fields/multiselect-form-field';
import '../form/fields/date-form-field';
import '../form/fields/dropdown-form-field';
import '../form/fields/person-form-field';
import '../form/fields/rich-text-form-field';
import '../form/fields/text-form-field';
import template from './custom-attributes-field.stache';

const ViewModel = canDefineMap.extend({
  disabled: {
    type: 'htmlbool',
  },
  type: {
    value: null,
  },
  value: {
    value: null,
  },
  fieldId: {
    value: null,
  },
  placeholder: {
    value: '',
  },
  options: {
    value: () => [],
  },
  isLocalCa: {
    value: false,
  },
  fieldValueChanged(e, scope) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: e.fieldId,
      value: e.value,
      field: scope,
    });
  },
});

export default canComponent.extend({
  tag: 'custom-attributes-field',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

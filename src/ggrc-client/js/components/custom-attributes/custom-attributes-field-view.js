/*
   Copyright (C) 2020 Google Inc.
   Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../inline/readonly-inline-content';
import '../form/field-views/checkbox-form-field-view';
import '../form/field-views/date-form-field-view';
import '../form/field-views/person-form-field-view';
import '../form/field-views/text-form-field-view';
import template from './custom-attributes-field-view.stache';

export default canComponent.extend({
  tag: 'custom-attributes-field-view',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    type: null,
    value: null,
  }),
});

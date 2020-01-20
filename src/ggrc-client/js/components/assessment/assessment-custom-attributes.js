/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './info-pane/confirm-edit-action';
import template from './custom-attributes.stache';

export default canComponent.extend({
  tag: 'assessment-custom-attributes',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    items: [],
    editMode: false,
    modifiedFields: {},
    isEditDenied: false,
    updateGlobalAttribute: function (event, field) {
      this.attr('modifiedFields').attr(field.customAttributeId, event.value);
      this.dispatch({
        type: 'onUpdateAttributes',
        globalAttributes: this.attr('modifiedFields'),
      });
      this.attr('modifiedFields', {}, true);
    },
  }),
});

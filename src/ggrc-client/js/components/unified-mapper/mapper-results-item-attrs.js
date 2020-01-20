/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../tree/tree-item-custom-attribute';
import '../tree/tree-field-wrapper';
import '../tree/tree-field';
import '../tree/tree-item-attr';
import template from './templates/mapper-results-item-attrs.stache';

export default canComponent.extend({
  tag: 'mapper-results-item-attrs',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    columns: [],
    serviceColumns: [],
    modelType: '',
    aggregatedColumns() {
      return this.attr('columns').concat(this.attr('serviceColumns'));
    },
  }),
  events: {
    click(element, event) {
      if ($(event.target).is('.link')) {
        event.stopPropagation();
      }
    },
  },
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../tree/tree-item-custom-attribute';
import '../tree/tree-field-wrapper';
import '../tree/tree-field';
import '../tree/tree-item-attr';
import template from './templates/mapper-results-item-attrs.stache';

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  columns: {
    value: () => [],
  },
  serviceColumns: {
    value: () => [],
  },
  modelType: {
    value: '',
  },
  aggregatedColumns() {
    return this.columns.concat(this.serviceColumns);
  },
});

export default canComponent.extend({
  tag: 'mapper-results-item-attrs',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    click(element, event) {
      if ($(event.target).is('.link')) {
        event.stopPropagation();
      }
    },
  },
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/mapper-results-items-header.stache';

export default canComponent.extend({
  tag: 'mapper-results-items-header',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    columns: [],
    serviceColumns: [],
    sortKey: '',
    sortDirection: 'asc',
    modelType: '',
    aggregatedColumns() {
      return this.attr('columns').concat(this.attr('serviceColumns'));
    },
    isSorted(attr) {
      return attr.attr('attr_sort_field') === this.attr('sortKey');
    },
    isSortedAsc() {
      return this.attr('sortDirection') === 'asc';
    },
    applySort(attr) {
      if (this.isSorted(attr)) {
        this.toggleSortDirection();
        return;
      }
      this.attr('sortKey', attr.attr('attr_sort_field'));
      this.attr('sortDirection', 'asc');
    },
    toggleSortDirection() {
      if (this.attr('sortDirection') === 'asc') {
        this.attr('sortDirection', 'desc');
      } else {
        this.attr('sortDirection', 'asc');
      }
    },
  }),
});

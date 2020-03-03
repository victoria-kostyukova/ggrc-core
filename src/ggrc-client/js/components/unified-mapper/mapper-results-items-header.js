/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/mapper-results-items-header.stache';

const ViewModel = canDefineMap.extend({
  columns: {
    value: () => [],
  },
  serviceColumns: {
    value: () => [],
  },
  sortKey: {
    value: '',
  },
  sortDirection: {
    value: 'asc',
  },
  modelType: {
    value: '',
  },
  aggregatedColumns() {
    return this.columns.concat(this.serviceColumns);
  },
  isSorted(attr) {
    return attr.attr_sort_field === this.sortKey;
  },
  isSortedAsc() {
    return this.sortDirection === 'asc';
  },
  applySort(attr) {
    if (this.isSorted(attr)) {
      this.toggleSortDirection();
      return;
    }
    this.sortKey = attr.attr_sort_field;
    this.sortDirection = 'asc';
  },
  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  },
});

export default canComponent.extend({
  tag: 'mapper-results-items-header',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

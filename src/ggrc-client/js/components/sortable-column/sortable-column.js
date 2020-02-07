/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './sortable-column.stache';

const ViewModel = canDefineMap.extend({
  sort: {
    value: () => ({}),
  },
  sortField: {
    value: '',
  },
  isSorted: {
    get() {
      return this.sort.field === this.sortField;
    },
  },
  isSortedAsc: {
    get() {
      return this.sort.direction === 'asc';
    },
  },
  applySort() {
    if (this.isSorted) {
      this.toggleSortDirection();
    } else {
      this.sort.field = this.sortField;
      this.sort.direction = 'asc';
    }

    this.sort.dispatch('changed');
  },
  toggleSortDirection() {
    if (this.sort.direction === 'asc') {
      this.sort.direction = 'desc';
    } else {
      this.sort.direction = 'asc';
    }
  },
});

export default canComponent.extend({
  tag: 'sortable-column',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '{$content} click'() {
      this.viewModel.applySort();
    },
  },
});

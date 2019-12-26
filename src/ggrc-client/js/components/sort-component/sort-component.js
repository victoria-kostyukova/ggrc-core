/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';

const ViewModel = canDefineMap.extend({
  sortedItems: {
    value: () => [],
  },
  items: {
    value: () => [],
  },
  sort() {
    this.sortedItems = this.items.sort();
  },
});

export default canComponent.extend({
  tag: 'sort-component',
  leakScope: true,
  ViewModel,
  events: {
    '{viewModel.items} change'() {
      this.viewModel.sort();
    },
    init() {
      this.viewModel.sort();
    },
  },
});

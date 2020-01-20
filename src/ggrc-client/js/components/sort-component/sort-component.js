/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'sort-component',
  leakScope: true,
  viewModel: canMap.extend({
    sortedItems: [],
    items: [],
    sort() {
      const items = this.attr('items');
      const sortedItems = items.sort();
      this.attr('sortedItems', sortedItems);
    },
  }),
  events: {
    '{viewModel.items} change'() {
      this.viewModel.sort();
    },
    init() {
      this.viewModel.sort();
    },
  },
});

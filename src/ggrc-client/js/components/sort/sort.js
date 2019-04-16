/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default can.Component.extend({
  tag: 'sort-component',
  leakScope: true,
  viewModel: {
    sortedItems: [],
    items: [],
    sort() {
      const items = this.attr('items');
      const sortedItems = items.sort();
      this.attr('sortedItems', sortedItems);
    },
  },
  events: {
    '{viewModel.items} change'() {
      this.viewModel.sort();
    },
    inserted() {
      this.viewModel.sort();
    },
  },
});

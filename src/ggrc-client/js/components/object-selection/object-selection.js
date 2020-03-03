/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';

const ViewModel = canDefineMap.extend({
  state: {
    value: null,
  },
  selectedItems: {
    value: () => [],
  },
  items: {
    value: () => [],
  },
  // This is an array by default replace with deferred on actual load
  allItems: {
    value: () => [],
  },
  disabledIds: {
    value: () => [],
  },
  allSelected: {
    value: false,
  },
  selectAllCheckboxValue: {
    value: false,
  },
  select(item) {
    let id = item.id;
    let type = item.type;

    if (this.indexOfSelected(id, type) < 0) {
      this.selectedItems.push(item);
      this.markItem(id, type, true);
    } else {
      console.warn(`Same Object is Selected Twice! id: ${id} type: ${type}`);
    }
  },
  deselect(item) {
    let id = item.id;
    let type = item.type;
    let list = this.selectedItems;
    let index = this.indexOfSelected(id, type);
    if (index >= 0) {
      list.splice(index, 1);
      this.markItem(id, type, false);
      this.allSelected = false;
    }
  },
  indexOfSelected(id, type) {
    let list = this.selectedItems;
    let index = -1;
    list.each(function (item, i) {
      if (id === item.id && type === item.type) {
        index = i;
        return false;
      }
    });
    return index;
  },
  markItem(id, type, isSelected) {
    this.items.each((item) => {
      if (id === item.id && type === item.type) {
        item.markedSelected = isSelected;
        return false;
      }
    });
  },
  toggleItems(isSelected) {
    this.items.each((item) => {
      if (!item.isDisabled) {
        item.markedSelected = isSelected;
      }
    });
  },
  markSelectedItems() {
    this.selectedItems.each((selected) => {
      this.markItem(selected.id, selected.type, true);
    });
  },
  emptySelection() {
    this.allSelected = false;
    // Remove all selected items
    this.selectedItems.replace([]);
    // Remove visual selection
    this.toggleItems(false);
  },
  deselectAll() {
    this.emptySelection();
  },
  selectAll() {
    let selectedItems;
    let disabledIds = this.disabledIds;
    this.allSelected = true;
    // Replace with actual items loaded from Query API
    this.allItems
      .then((allItems) => {
        selectedItems = allItems.filter((item) => {
          return disabledIds.indexOf(item.id) < 0;
        });
        this.selectedItems.replace(selectedItems);
        // Add visual selection
        this.toggleItems(true);
      })
      .catch(() => {
        this.clearSelection();
      });
  },
});

/**
 * Object Selection component
 */
export default canComponent.extend({
  tag: 'object-selection',
  leakScope: true,
  ViewModel,
  events: {
    '{viewModel.state} resetSelection'() {
      this.viewModel.emptySelection();
    },
    '{viewModel.items} add'() {
      this.viewModel.markSelectedItems();
    },
    'object-selection-item selectItem'(el, ev, item) {
      this.viewModel.select(item);
    },
    'object-selection-item deselectItem'(el, ev, item) {
      this.viewModel.deselect(item);
    },
    '{viewModel} selectAllCheckboxValue'([scope], ev, value) {
      if (value) {
        this.viewModel.selectAll();
      } else {
        this.viewModel.deselectAll();
      }
    },
  },
});

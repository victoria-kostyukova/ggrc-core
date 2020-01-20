/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
// Base viewModel for 'autocomplete-result' component which is part of 'custom-autocomplete'.
// It displays available items and handles selected items.

import {KEY_MAP} from './autocomplete-input';

export default canMap.extend({
  define: {
    items: {
      set(items) {
        const _items = items.map((item, index) => ({
          ...item.serialize(),
          _index: index,
        }));
        if (_items.length) {
          _items[0].extraCls = 'active';
        }
        this.attr('_items', _items);

        return items;
      },
    },
    actionKey: {
      set(key) {
        switch (key) {
          case KEY_MAP.ENTER:
            this.dispatch({
              type: 'selectActive',
            });
            break;
          case KEY_MAP.ARROW_DOWN:
            this.dispatch({
              type: 'highlightNext',
            });
            break;
          case KEY_MAP.ARROW_UP:
            this.dispatch({
              type: 'highlightPrevious',
            });
            break;
          default:
            break;
        }
        return key;
      },
    },
  },
  items: [],
  _items: [],
  currentValue: null,
  showResults: false,
  showNewValue: false,
  // event must be provided by parent component
  addNewItem: function () {
    this.dispatch({
      type: 'addNewItem',
      newValue: this.attr('currentValue'),
    });
    this.hide();
  },
  // event must be provided by parent component
  selectItem: function (index) {
    this.dispatch({
      type: 'selectItem',
      item: this.attr('items')[index],
    });
    this.hide();
  },
  hide: function () {
    this.attr('currentValue', null);
    this.attr('showResults', false);
  },
});

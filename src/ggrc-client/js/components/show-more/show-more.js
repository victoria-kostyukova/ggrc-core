/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './show-more.stache';

/**
 * A component that limits list of items to acceptable count and shows
 * "Show more(<items count>)" link
 * Usage: <show-more limit:from="5" items:from="itemsToDisplay"
 *          shouldShowAllItems:from="true">
 *          <some-item-component></some-item-component>
 *        </show-more>
 */

export default canComponent.extend({
  tag: 'show-more',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      limit: {
        type: 'number',
        value: 5,
      },
      items: {
        value: function () {
          return [];
        },
      },
      shouldShowAllItems: {
        type: 'boolean',
        value: function () {
          let isOverLimit = this.attr('isOverLimit');
          return isOverLimit;
        },
      },
      isOverLimit: {
        get: function () {
          let itemsCount = this.attr('items.length');
          let limit = this.attr('limit');

          return itemsCount > limit;
        },
      },
      visibleItems: {
        get: function () {
          let limit = this.attr('limit');
          let isOverLimit = this.attr('isOverLimit');
          let shouldShowAllItems = this.attr('shouldShowAllItems');
          let items = this.attr('items');

          return (isOverLimit && !shouldShowAllItems) ?
            items.slice(0, limit) :
            items;
        },
      },
      showAllButtonText: {
        get: function () {
          let itemsCount = this.attr('items.length');
          let limit = this.attr('limit');
          let shouldShowAllItems = this.attr('shouldShowAllItems');

          return !shouldShowAllItems ?
            'Show more (' + (itemsCount - limit) + ')' :
            'Show less';
        },
      },
    },
    toggleShowAll: function (event) {
      let newValue;
      event.stopPropagation();
      newValue = !this.attr('shouldShowAllItems');
      this.attr('shouldShowAllItems', newValue);
    },
  }),
});

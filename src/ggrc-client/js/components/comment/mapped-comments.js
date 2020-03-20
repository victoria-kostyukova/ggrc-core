/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../object-list-item/comment-list-item';
import '../object-list/object-list';
import template from './mapped-comments.stache';

const ViewModel = canDefineMap.extend({
  noItemsText: {
    get() {
      if (this.showNoItemsText && !this.isLoading) {
        return 'No comments';
      }
      return '';
    },
  },
  isLoading: {
    value: false,
  },
  mappedItems: {
    value: () => [],
  },
  baseInstance: {
    value: () => ({}),
  },
  showNoItemsText: {
    value: false,
  },
});

/**
 * Assessment specific mapped controls view component
 */
export default canComponent.extend({
  tag: 'mapped-comments',
  view: canStache(template),
  ViewModel,
});

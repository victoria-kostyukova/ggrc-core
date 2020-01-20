/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../object-list-item/comment-list-item';
import '../object-list/object-list';
import template from './mapped-comments.stache';

/**
 * Assessment specific mapped controls view component
 */
export default canComponent.extend({
  tag: 'mapped-comments',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    define: {
      noItemsText: {
        type: 'string',
        get() {
          if (this.attr('showNoItemsText') && !this.attr('isLoading')) {
            return 'No comments';
          }
          return '';
        },
      },
    },
    isLoading: false,
    mappedItems: [],
    baseInstance: {},
    showNoItemsText: false,
  }),
});

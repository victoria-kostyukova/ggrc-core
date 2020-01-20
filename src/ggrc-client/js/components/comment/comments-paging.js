/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './comments-paging.stache';
import '../spinner-component/spinner-component';

export default canComponent.extend({
  tag: 'comments-paging',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    define: {
      showButton: {
        get() {
          return this.attr('total') > this.attr('pageSize') &&
            !this.attr('isLoading');
        },
      },
      canShowMore: {
        get() {
          return this.attr('comments.length') < this.attr('total');
        },
      },
      canHide: {
        get() {
          return this.attr('comments.length') > this.attr('pageSize');
        },
      },
      remain: {
        get() {
          let pageSize = this.attr('pageSize');
          let count = this.attr('total') - this.attr('comments.length');
          return count > pageSize ? pageSize : count;
        },
      },
    },
    comments: [],
    pageSize: 10,
    total: 0,
    isLoading: false,
    showMore() {
      this.dispatch({
        type: 'showMore',
      });
    },
    showLess() {
      this.dispatch({
        type: 'showLess',
      });
    },
  }),
});

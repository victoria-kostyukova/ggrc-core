/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './comments-paging.stache';
import '../spinner-component/spinner-component';

const ViewModel = canDefineMap.extend({
  showButton: {
    get() {
      return this.total > this.pageSize && !this.isLoading;
    },
  },
  canShowMore: {
    get() {
      return this.comments.attr('length') < this.total;
    },
  },
  canHide: {
    get() {
      return this.comments.attr('length') > this.pageSize;
    },
  },
  remain: {
    get() {
      const pageSize = this.pageSize;
      const count = this.total - this.comments.attr('length');
      return count > pageSize ? pageSize : count;
    },
  },
  comments: {
    value: () => [],
  },
  pageSize: {
    value: 10,
  },
  total: {
    value: 0,
  },
  isLoading: {
    value: false,
  },
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
});

export default canComponent.extend({
  tag: 'comments-paging',
  view: canStache(template),
  ViewModel,
});

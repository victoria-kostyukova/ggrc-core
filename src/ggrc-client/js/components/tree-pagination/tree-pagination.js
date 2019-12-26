/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loRange from 'lodash/range';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './tree-pagination.stache';

const ViewModel = canDefineMap.extend({
  paging: {
    value: () => ({}),
  },
  placement: {
    value: '',
  },
  isPageSizeSelectShown: {
    get() {
      return this.paging.attr('pageSizeSelect.length') > 1;
    },
  },
  setCurrentPage(pageNumber) {
    this.paging.attr('current', pageNumber);
  },
  setLastPage() {
    this.paging.attr('current', this.paging.count);
  },
  setFirstPage() {
    this.paging.attr('current', 1);
  },
  setPrevPage() {
    if (this.paging.current > 1) {
      this.paging.attr('current', this.paging.current - 1);
    }
  },
  setNextPage() {
    if (this.paging.current < this.paging.count) {
      this.paging.attr('current', this.paging.current + 1);
    }
  },
  getPaginationInfo() {
    let current = this.paging.attr('current');
    let size = this.paging.attr('pageSize');
    let total = this.paging.attr('total');
    let first = (current - 1) * size + 1;
    let last = current * size < total ? current * size : total;

    return total ? `${first}-${last} of ${total}` : 'No records';
  },
  setPageSize(pageSize) {
    if (parseInt(pageSize)) {
      this.paging.attr('pageSize', pageSize);
    }
  },
  pagesList() {
    return loRange(1, this.paging.attr('count') + 1);
  },
  getPageTitle(pageNumber) {
    let size = this.paging.attr('pageSize');
    let total = this.paging.attr('total');

    let first = (pageNumber - 1) * size + 1;
    let last = pageNumber * size < total ? pageNumber * size : total;

    return `Page ${pageNumber}: ${first}-${last}`;
  },
});

/**
 * A component that renders a tree pagination widget
 * Usage: <tree-pagination paging:from="paging"></tree-pagination>
 * Optional parameter: placement:from="'top'" - to display content above the control
 */
export default canComponent.extend({
  tag: 'tree-pagination',
  view: canStache(template),
  init() {
    /**
     * Entrance object validation
     *
     * paging = {
     *  current: {Number}, - current page number
     *  pageSize: {Number}, - amount elements on the page
     *  total: {Number}, - total amount of elements
     *  count: {Number}, - total amount of pages
     *  pageSizeSelect: {Array} - array of numbers that used for pageSize popover
     *  disabled: {Boolean} - true if frontend doesn't finish request to the server otherwise false
     * }
     */
    if (!this.viewModel.paging) {
      throw new Error('Paging object didn\'t init');
    }
  },
  leakScope: true,
  ViewModel,
});

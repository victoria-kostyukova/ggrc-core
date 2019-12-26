/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../sort-component/sort-component';
import template from './templates/tree-view.stache';

const ViewModel = canDefineMap.extend({
  notResult: {
    get() {
      return !this.loading && !this.items.length;
    },
  },
  items: {
    value: () => [],
  },
  parentInstance: {
    value: null,
  },
  model: {
    value: null,
  },
  selectedColumns: {
    value: () => [],
  },
  mandatory: {
    value: () => [],
  },
  disableConfiguration: {
    value: null,
  },
  loading: {
    value: false,
  },
  limitDepthTree: {
    value: 0,
  },
  depthFilter: {
    value: '',
  },
});

export default canComponent.extend({
  tag: 'tree-view',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

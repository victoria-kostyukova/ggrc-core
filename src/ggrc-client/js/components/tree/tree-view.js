/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../sort-component/sort-component';
import template from './templates/tree-view.stache';

let viewModel = canMap.extend({
  define: {
    notResult: {
      type: Boolean,
      get: function () {
        return !this.attr('loading') && !this.attr('items').length;
      },
    },
  },
  items: [],
  parentInstance: null,
  model: null,
  selectedColumns: [],
  mandatory: [],
  disableConfiguration: null,
  loading: false,
  limitDepthTree: 0,
  depthFilter: '',
});

export default canComponent.extend({
  tag: 'tree-view',
  view: canStache(template),
  leakScope: true,
  viewModel,
});

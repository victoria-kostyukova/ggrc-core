/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsObject from 'lodash/isObject';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './revision-log-data.stache';

let viewModel = canMap.extend({
  data: null,
  isLoading: false,
  define: {
    isObject: {
      type: 'boolean',
      get: function () {
        return loIsObject(this.attr('data'));
      },
    },
  },
});

export default canComponent.extend({
  tag: 'revision-log-data',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-no-results.stache';

const ViewModel = canDefineMap.extend({
  text: {
    value: 'No results, please check your filter criteria',
    set(value) {
      return value || 'No results...';
    },
    show: {
      set(value) {
        return value || false;
      },
    },
  },
});

export default canComponent.extend({
  tag: 'tree-no-results',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

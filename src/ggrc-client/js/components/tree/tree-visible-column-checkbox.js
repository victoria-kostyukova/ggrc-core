/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-visible-column-checkbox.stache';

export default canComponent.extend({
  tag: 'tree-visible-column-checkbox',
  view: canStache(template),
  leakScope: true,
  ViewModel: canDefineMap.extend({
    column: {
      value: () => ({}),
    },
  }),
});

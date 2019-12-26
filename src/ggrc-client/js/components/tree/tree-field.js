/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-field.stache';
import {getTruncatedList} from '../../plugins/ggrc-utils';

const ViewModel = canDefineMap.extend({
  tooltipContent: {
    get() {
      return getTruncatedList(this.source);
    },
  },
  showTooltip: {
    value: true,
  },
  source: {
    value: () => [],
  },
});

export default canComponent.extend({
  tag: 'tree-field',
  view: canStache(template),
  ViewModel,
});

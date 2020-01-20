/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/tree-field.stache';
import {getTruncatedList} from '../../plugins/ggrc-utils';

export default canComponent.extend({
  tag: 'tree-field',
  view: canStache(template),
  viewModel: canMap.extend({
    define: {
      tooltipContent: {
        get() {
          let source = this.attr('source');
          return getTruncatedList(source);
        },
      },
    },
    showTooltip: true,
    source: [],
  }),
});

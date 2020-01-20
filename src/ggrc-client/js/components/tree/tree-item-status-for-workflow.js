/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/tree-item-status-for-workflow.stache';

const viewModel = canMap.extend({
  define: {
    statusCSSClass: {
      type: 'string',
      get() {
        const status = this.attr('instance.status');
        let result = '';

        if (status) {
          const postfix = status
            .replace(/[\s\t]+/g, '')
            .toLowerCase();
          result = `state-${postfix}`;
        }

        return result;
      },
    },
  },
  instance: {},
});

export default canComponent.extend({
  tag: 'tree-item-status-for-workflow',
  view: canStache(template),
  leakScope: true,
  viewModel,
});

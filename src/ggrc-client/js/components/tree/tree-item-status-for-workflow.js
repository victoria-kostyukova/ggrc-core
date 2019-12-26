/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-item-status-for-workflow.stache';

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  statusCSSClass: {
    get() {
      const status = this.instance.attr('status');
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
});

export default canComponent.extend({
  tag: 'tree-item-status-for-workflow',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

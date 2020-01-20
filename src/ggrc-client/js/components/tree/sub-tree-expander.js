/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {
  getPageType,
} from '../../plugins/utils/current-page-utils';

export default canComponent.extend({
  tag: 'sub-tree-expander',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      contextName: {
        type: String,
        get: function () {
          return getPageType();
        },
      },
    },
    expandNotDirectly: function () {
      this.dispatch('expandNotDirectly');
    },
    expanded: null,
    disabled: false,
    onChangeState: null,
    onExpand: function () {
      this.attr('expanded', !this.attr('expanded'));
      this.onChangeState(this.attr('expanded'));
    },
  }),
});

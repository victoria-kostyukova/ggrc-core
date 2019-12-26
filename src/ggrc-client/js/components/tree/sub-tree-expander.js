/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  getPageType,
} from '../../plugins/utils/current-page-utils';

export default canComponent.extend({
  tag: 'sub-tree-expander',
  leakScope: true,
  ViewModel: canDefineMap.extend({
    expanded: {
      value: null,
    },
    disabled: {
      value: false,
    },
    onChangeState: {
      value: null,
    },
    contextName: {
      get() {
        return getPageType();
      },
    },
    expandNotDirectly() {
      this.dispatch('expandNotDirectly');
    },
    onExpand: function () {
      this.expanded = !this.expanded;
      this.onChangeState(this.expanded);
    },
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './mega-relation-selection-item.stache';
import pubSub from '../../pub-sub';

export default canComponent.extend({
  tag: 'mega-relation-selection-item',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    mapAsChild: null,
    isDisabled: false,
    id: null,
    element: null,
    switchRelation(event, mapAsChild) {
      pubSub.dispatch({
        type: 'mapAsChild',
        id: this.attr('id'),
        val: mapAsChild ? 'child' : 'parent',
      });

      event.stopPropagation();
    },
    define: {
      childRelation: {
        get() {
          return this.attr('mapAsChild') === true;
        },
      },
      parentRelation: {
        get() {
          return this.attr('mapAsChild') === false;
        },
      },
    },
  }),
});

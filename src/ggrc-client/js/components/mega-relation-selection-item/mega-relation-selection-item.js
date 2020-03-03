/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './mega-relation-selection-item.stache';
import pubSub from '../../pub-sub';

const ViewModel = canDefineMap.extend({
  mapAsChild: {
    value: null,
  },
  isDisabled: {
    value: false,
  },
  id: {
    value: null,
  },
  element: {
    value: null,
  },
  switchRelation(event, mapAsChild) {
    pubSub.dispatch({
      type: 'mapAsChild',
      id: this.id,
      val: mapAsChild ? 'child' : 'parent',
    });

    event.stopPropagation();
  },
  childRelation: {
    get() {
      return this.mapAsChild === true;
    },
  },
  parentRelation: {
    get() {
      return this.mapAsChild === false;
    },
  },
});

export default canComponent.extend({
  tag: 'mega-relation-selection-item',
  view: canStache(template),
  ViewModel,
});

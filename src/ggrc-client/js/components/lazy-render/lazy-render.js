/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';

const ViewModel = canDefineMap.extend({
  activated: {
    type: 'boolean',
    value: false,
  },
  activate: {
    set(value) {
      if (!this.activated && value) {
        this.activated = true;
      }
      return value;
    },
  },
});

/**
 *
 */
export default canComponent.extend({
  tag: 'lazy-render',
  view: canStache('{{#if activated}}<content/>{{/if}}'),
  leakScope: true,
  ViewModel,
});

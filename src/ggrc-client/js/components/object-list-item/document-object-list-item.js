/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './document-object-list-item.stache';
import '../spinner-component/spinner-component';

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  itemData: {
    get() {
      return this.instance;
    },
  },
  itemTitle: {
    get() {
      return this.itemData.attr('title') || this.itemData.attr('link');
    },
  },
  itemCreationDate: {
    get() {
      return this.itemData.attr('created_at');
    },
  },
  itemStatus: {
    get() {
      return this.itemData.attr('status');
    },
  },
  isItemValid: {
    get() {
      return this.itemStatus.toLowerCase() !== 'deprecated';
    },
  },
});

/**
 * Simple component to show Document-like Objects
 */
export default canComponent.extend({
  tag: 'document-object-list-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

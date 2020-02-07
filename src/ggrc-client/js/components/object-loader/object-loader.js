/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh-queue';
import {reify, isReifiable} from '../../plugins/utils/reify-utils';

const ViewModel = canDefineMap.extend({
  isObjectLoading: {
    value: false,
  },
  loadedObject: {
    value: null,
  },
  path: {
    set(value) {
      if (value && isReifiable(value)) {
        this.isObjectLoading = true;

        new RefreshQueue()
          .enqueue(reify(value))
          .trigger()
          .then((response) => {
            this.loadedObject = response[0];
          })
          .always(() => {
            this.isObjectLoading = false;
          });
      } else {
        this.loadedObject = null;
      }
      return value;
    },
  },
});

export default canComponent.extend({
  tag: 'object-loader',
  leakSkope: true,
  ViewModel,
});

/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh-queue';
import {reify, isReifiable} from '../../plugins/utils/reify-utils';

export default canComponent.extend({
  tag: 'object-loader',
  leakSkope: true,
  viewModel: canMap.extend({
    isObjectLoading: false,
    define: {
      path: {
        set(value) {
          if (value && isReifiable(value)) {
            this.attr('isObjectLoading', true);

            new RefreshQueue()
              .enqueue(reify(value))
              .trigger()
              .then((response) => {
                this.attr('loadedObject', response[0]);
              })
              .always(() => {
                this.attr('isObjectLoading', false);
              });
          } else {
            this.attr('loadedObject', null);
          }
          return value;
        },
      },
    },
    loadedObject: null,
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './model-loader.stache';

const ViewModel = canDefineMap.extend({
  loadedModel: {
    get(last, set) {
      import(`../../models/${this.path}`).then((model) => set(model.default));
    },
  },
  path: {
    value: '',
  },
});

export default canComponent.extend({
  tag: 'model-loader',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

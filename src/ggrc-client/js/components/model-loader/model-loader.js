/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './model-loader.stache';

export default canComponent.extend({
  tag: 'model-loader',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      loadedModel: {
        get(last, set) {
          let path = this.attr('path');
          import(`../../models/${path}`).then((model) => set(model.default));
        },
      },
    },
    path: '',
  }),
});

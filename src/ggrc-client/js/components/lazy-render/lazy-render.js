/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
let viewModel = canMap.extend({
  define: {
    trigger: {
      type: 'boolean',
      set: function (value) {
        if (!this.attr('activated') && value) {
          this.attr('activated', true);
        }
      },
    },
  },
  activated: false,
});

/**
 *
 */
export default canComponent.extend({
  tag: 'lazy-render',
  view: canStache('{{#if activated}}<content/>{{/if}}'),
  leakScope: true,
  viewModel,
});

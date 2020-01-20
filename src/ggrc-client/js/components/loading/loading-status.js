/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './loading-status.stache';

export default canComponent.extend({
  tag: 'loading-status',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      showSpinner: {
        type: 'boolean',
        value: false,
      },
      alwaysShowText: {
        type: 'boolean',
        value: false,
      },
      isLoading: {
        type: 'boolean',
        value: false,
      },
    },
    loadingText: '',
  }),
});

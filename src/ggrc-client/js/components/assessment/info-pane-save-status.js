/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'info-pane-save-status',
  leakScope: true,
  viewModel: canMap.extend({
    infoPaneSaving: false,
  }),
});

/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'action-toolbar-control',
  view: canStache(
    '<div class="action-toolbar__controls-item"><content/></div>'
  ),
  leakScope: true,
  viewModel: canMap.extend({}),
});


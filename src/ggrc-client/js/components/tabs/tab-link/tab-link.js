/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
const viewModel = canMap.extend({
  tabType: 'link',
  instance: null,
  titleText: '',
  linkType: '',
  panels: [],
  setupPanels() {
    this.attr('panels').push(this);
    this.attr('panels').dispatch('panelAdded');
  },
});

export default canComponent.extend({
  tag: 'tab-link',
  leakScope: true,
  viewModel,
  events: {
    inserted() {
      this.viewModel.setupPanels();
    },
  },
});

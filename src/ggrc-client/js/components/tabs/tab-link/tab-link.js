/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

const viewModel = can.Map.extend({
  isTabLink: true,
  instance: null,
  titleText: '',
  linkType: '',
  panels: [],
  setupPanels() {
    this.attr('panels').push(this);
    this.attr('panels').dispatch('panelAdded');
  },
});

export default can.Component.extend({
  tag: 'tab-link',
  leakScope: true,
  viewModel,
  events: {
    inserted() {
      this.viewModel.setupPanels();
    },
  },
});

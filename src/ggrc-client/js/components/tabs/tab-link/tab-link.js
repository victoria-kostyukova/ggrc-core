/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  getChangeLogUrl,
  getProposalsUrl,
} from './../../../plugins/utils/ggrcq-utils';

const viewModel = can.Map.extend({
  isTabLink: true,
  instance: null,
  titleText: '',
  type: '',
  link: '',
  panels: [],
  setupLink() {
    const instance = this.attr('instance');

    switch (this.attr('type')) {
      case 'change-log':
        this.attr('link', getChangeLogUrl(instance));
        break;
      case 'proposals':
        this.attr('link', getProposalsUrl(instance));
        break;
    }
  },
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
      this.viewModel.setupLink();
      this.viewModel.setupPanels();
    },
  },
});

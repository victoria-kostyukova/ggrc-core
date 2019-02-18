/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './templates/general-page-header.stache';
import {showInfoProposalControls} from '../../plugins/utils/ggrcq-utils';

const viewModel = can.Map.extend({
  define: {
    redirectionEnabled: {
      get() {
        return showInfoProposalControls(this.attr('instance'));
      },
    },
  },
  instance: null,
});

export default can.Component.extend({
  tag: 'general-page-header',
  template,
  leakScope: true,
  viewModel,
});

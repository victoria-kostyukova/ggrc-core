/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './templates/general-page-header.stache';
import {
  isProposableExternally,
  isChangeableExternally,
} from '../../plugins/utils/ggrcq-utils';
import {isSnapshot} from '../../plugins/utils/snapshot-utils';

const viewModel = can.Map.extend({
  define: {
    redirectionEnabled: {
      get() {
        return isProposableExternally(this.attr('instance'));
      },
    },
    showProposalButton: {
      get() {
        const instance = this.attr('instance');
        return (
          instance.class.isProposable &&
          !isChangeableExternally(instance) &&
          !isSnapshot(instance)
        );
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

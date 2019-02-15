/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './templates/proposable-control.stache';
import {getProposalAttrUrl} from '../../../plugins/utils/ggrcq-utils';

const viewModel = can.Map.extend({
  define: {
    link: {
      get() {
        return getProposalAttrUrl(this.attr('instance'), this.attr('attrName'));
      },
    },
  },
  instance: null,
  attrName: '',
});

export default can.Component.extend({
  tag: 'proposable-control',
  leakScope: false,
  template,
  viewModel,
});

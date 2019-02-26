/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
import template from './templates/proposable-attribute.stache';
import {isProposableExternally} from '../../../plugins/utils/ggrcq-utils';

const viewModel = can.Map.extend({
  define: {
    showToolbarControls: {
      get() {
        return isProposableExternally(this.attr('instance'));
      },
    },
  },
  instance: null,
  attrName: '',
  title: '',
  mandatory: false,
});

export default can.Component.extend({
  tag: 'proposable-attribute',
  leakScope: false,
  template,
  viewModel,
});

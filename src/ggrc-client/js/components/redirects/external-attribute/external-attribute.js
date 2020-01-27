/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/external-attribute.stache';
import {isChangeableExternally} from '../../../plugins/utils/ggrcq-utils';
import '../proposable-control/proposable-control';
import '../external-control/external-control';
import {isSnapshot} from '../../../plugins/utils/snapshot-utils';

const viewModel = canMap.extend({
  define: {
    showToolbarControls: {
      get() {
        const instance = this.attr('instance');
        return isChangeableExternally(instance) && !isSnapshot(instance);
      },
    },
  },
  instance: null,
  attrName: '',
  title: '',
  mandatory: false,
});

export default canComponent.extend({
  tag: 'external-attribute',
  leakScope: false,
  view: canStache(template),
  viewModel,
});

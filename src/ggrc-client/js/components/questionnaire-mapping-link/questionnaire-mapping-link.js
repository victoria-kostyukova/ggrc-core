/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './questionnaire-mapping-link.stache';
import {
  getMappingUrl,
  getUnmappingUrl,
} from '../../plugins/utils/ggrcq-utils';

export default canComponent.extend({
  tag: 'questionnaire-mapping-link',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    define: {
      externalUrl: {
        get() {
          let instance = this.attr('instance');
          let destination = this.attr('destinationModel');

          switch (this.attr('type')) {
            case 'map': {
              return getMappingUrl(instance, destination);
            }
            case 'unmap': {
              return getUnmappingUrl(instance, destination);
            }
          }
        },
      },
    },
    instance: null,
    destinationModel: null,
    cssClasses: '',
    type: 'map',
  }),
});

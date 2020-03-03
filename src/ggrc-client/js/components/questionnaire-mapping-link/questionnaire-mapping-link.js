/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './questionnaire-mapping-link.stache';
import {
  getMappingUrl,
  getUnmappingUrl,
} from '../../plugins/utils/ggrcq-utils';

const ViewModel = canDefineMap.extend({
  externalUrl: {
    get() {
      let instance = this.instance;
      let destination = this.destinationModel;

      switch (this.type) {
        case 'map': {
          return getMappingUrl(instance, destination);
        }
        case 'unmap': {
          return getUnmappingUrl(instance, destination);
        }
      }
    },
  },
  instance: {
    value: null,
  },
  destinationModel: {
    value: null,
  },
  cssClasses: {
    value: '',
  },
  type: {
    value: 'map',
  },
});

export default canComponent.extend({
  tag: 'questionnaire-mapping-link',
  view: canStache(template),
  ViewModel,
});

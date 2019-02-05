/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './questionnaire-mapping-link.stache';
import {getMappingUrl} from '../../plugins/utils/ggrcq-utils';

export default can.Component.extend({
  tag: 'questionnaire-mapping-link',
  template,
  viewModel: {
    define: {
      externalUrl: {
        get() {
          let instance = this.attr('instance');
          let destination = this.attr('destinationModel');
          return getMappingUrl(instance, destination);
        },
      },
    },
    instance: null,
    destinationModel: null,
  },
});

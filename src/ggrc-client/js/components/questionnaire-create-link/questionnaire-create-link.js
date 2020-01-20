/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './questionnaire-create-link.stache';
import {
  getCreateObjectUrl,
} from '../../plugins/utils/ggrcq-utils';

export default canComponent.extend({
  tag: 'questionnaire-create-link',
  view: canStache(template),
  viewModel: canMap.extend({
    define: {
      externalUrl: {
        get() {
          return getCreateObjectUrl(this.attr('model'));
        },
      },
    },
    model: null,
    cssClasses: '',
  }),
});

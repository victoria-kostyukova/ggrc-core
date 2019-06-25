/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loCapitalize from 'lodash/capitalize';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/feedback-link.stache';

const viewModel = canMap.extend({
  define: {
    link: {
      get() {
        return GGRC.config.CREATE_ISSUE_URL;
      },
    },
    title: {
      get() {
        return loCapitalize(GGRC.config.CREATE_ISSUE_BUTTON_NAME) ||
          'Feedback';
      },
    },
  },
});

export default canComponent.extend({
  tag: 'feedback-link',
  view: canStache(template),
  leakScope: true,
  viewModel,
});

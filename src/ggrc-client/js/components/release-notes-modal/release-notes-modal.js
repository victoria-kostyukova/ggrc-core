/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import moment from 'moment';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../release-notes-list/release-notes-list';

import template from './release-notes-modal.stache';

const viewModel = canMap.extend({
  define: {
    shortVersion: {
      type: 'string',
      get() {
        if (!GGRC.config.VERSION) {
          return '';
        }

        return GGRC.config.VERSION.replace(/ \(.*\)/, '');
      },
    },
    releaseNotesDate: {
      type: 'string',
      get() {
        return moment(BUILD_DATE).format('MMM D, YYYY');
      },
    },
  },
  modalTitle: 'What\'s new',
});

export default canComponent.extend({
  tag: 'release-notes-modal',
  view: canStache(template),
  leakScope: true,
  viewModel,
});

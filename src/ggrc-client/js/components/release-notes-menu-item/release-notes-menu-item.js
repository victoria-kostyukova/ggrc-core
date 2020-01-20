/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../release-notes-modal/release-notes-modal';
import template from './release-notes-menu-item.stache';
import PersonProfile from '../../models/service-models/person-profile';
import {getFormattedUtcDate} from '../../plugins/utils/date-utils';

const viewModel = canMap.extend({
  define: {
    version: {
      type: 'string',
      value: GGRC.config.VERSION,
    },
  },
  state: {
    open: false,
  },
  extraCssClass: 'release-notes',
  open(ev) {
    this.attr('state.open', true);
  },
});

const events = {
  async inserted(el) {
    let profile = await PersonProfile.findOne({
      id: GGRC.current_user.profile.id,
    });
    const lastSeenDate = getFormattedUtcDate(
      profile.attr('last_seen_whats_new')
    );
    const releaseNotesDate = getFormattedUtcDate(RELEASE_NOTES_DATE);

    if (releaseNotesDate !== lastSeenDate) {
      profile.attr('last_seen_whats_new', releaseNotesDate);
      return profile.save()
        .then(() => {
          this.viewModel.open();
        });
    }
  },
};

export default canComponent.extend({
  tag: 'release-notes-menu-item',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
});

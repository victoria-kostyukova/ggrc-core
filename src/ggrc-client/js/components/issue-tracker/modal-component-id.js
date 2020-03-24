/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../dropdown/autocomplete-dropdown';
import template from './templates/modal-component-id.stache';

export default canComponent.extend({
  tag: 'modal-component-id',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    createIssueTicketLink: CREATE_ISSUE_TICKET_LINK, // eslint-disable-line
    isEditMode: false,
    instance: {},
    componentIds: [],
    componentIdsLoading: false,
  }),
});

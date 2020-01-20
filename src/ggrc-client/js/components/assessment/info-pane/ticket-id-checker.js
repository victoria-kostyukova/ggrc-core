/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/ticket-id-checker.stache';

export default canComponent.extend({
  tag: 'ticket-id-checker',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      mandatory: {
        get() {
          let instance = this.attr('instance');
          return instance.constructor.unchangeableIssueTrackerIdStatuses
            .includes(instance.attr('status'));
        },
      },
    },
    instance: null,
    ticketId: null,
    isValid: true,
    issueTrackerEnabled: false,
    isEditIconDenied: false,
    modalState: {
      open: false,
    },
    checkTicketId(args) {
      if (args.value === 'true' && !this.attr('instance').issueCreated()) {
        this.attr('issueTrackerEnabled', true);
        this.showModal();
      } else {
        this.toggleIssueTracker(args.value);
      }
    },
    toggleIssueTracker(value) {
      this.dispatch({
        type: 'valueChange',
        value,
        propName: 'issue_tracker.enabled',
      });
    },
    showModal() {
      this.attr('modalState.open', true);
    },
    hideModal() {
      this.attr('modalState.open', false);
      this.attr('ticketId', null);
      this.attr('isValid', true);
    },
    cancel() {
      this.attr('issueTrackerEnabled', false);
      this.hideModal();
    },
    generateNewTicket() {
      this.toggleIssueTracker(true);
      this.hideModal();
    },
    linkWithExistingTicket() {
      let isValid = this.validateTicketId();
      if (!isValid) {
        return;
      }

      this.attr('instance.issue_tracker.issue_id', this.attr('ticketId'));
      this.toggleIssueTracker(true);
      this.hideModal();
    },
    validateTicketId() {
      let hasTicketId = !!this.attr('ticketId');

      this.attr('isValid', hasTicketId);
      return hasTicketId;
    },
  }),
  events: {
    '{viewModel} ticketId'() {
      let hasTicketId = !!this.viewModel.attr('ticketId');
      if (hasTicketId) {
        this.viewModel.attr('isValid', true);
      }
    },
  },
});

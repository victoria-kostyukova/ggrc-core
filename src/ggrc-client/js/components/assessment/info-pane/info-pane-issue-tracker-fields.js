/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../assessment/info-pane/confirm-edit-action';
import template from './templates/info-pane-issue-tracker-fields.stache';

const MANDATORY_LINKING_TEXT = `
  You are not allowed to generate new ticket for Issues at statuses
  "In Review", "Completed (no verification)",
  "Completed and Verified" and "Deprecated",
  only manual linking is allowed to perform.
  If you would like to keep the existing ticket linked
  to this issue do not edit this attribute.
  If you would like to link to a different ticket
  provide an existing ticket number.
`;

export default canComponent.extend({
  tag: 'info-pane-issue-tracker-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isTicketIdMandatory: {
        get() {
          let instance = this.attr('instance');
          return instance.constructor.unchangeableIssueTrackerIdStatuses
            .includes(instance.attr('status'));
        },
      },
      isAssessmentInstance: {
        get() {
          return this.attr('instance.type') === 'Assessment';
        },
      },
      peopleSyncDisabled: {
        get() {
          return Boolean(
            this.attr('instance.issue_tracker.enabled') &&
            this.attr('isAssessmentInstance') &&
            !this.attr('instance.audit.issue_tracker.people_sync_enabled')
          );
        },
      },
      linkingText: {
        get() {
          return this.attr('isAssessmentInstance') &&
            this.attr('isTicketIdMandatory') ?
            MANDATORY_LINKING_TEXT :
            this.attr('linkingNote');
        },
      },
    },
    instance: {},
    note: '',
    linkingNote: '',
    isEditIconDenied: false,
  }),
});

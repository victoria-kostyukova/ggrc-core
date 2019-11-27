/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canMap from 'can-map';
import {isAllowedFor} from '../../../permission';

export default canComponent.extend({
  tag: 'issue-main-content-wrapper',
  viewModel: canMap.extend({
    define: {
      isInfoPaneReadonly: {
        get() {
          return !isAllowedFor('update', this.attr('instance'));
        },
      },
      disableIssueTrackerDependentFields: {
        get() {
          return this.attr('isIssueLinked') &&
            this.attr('issueTrackerState') !== 'generateNew';
        },
      },
    },
    instance: {},
    isIssueLinked: false,
    issueTrackerState: '',
    updateIssueTrackerState({state}) {
      this.attr('issueTrackerState', state);
    },
  }),
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'issue-tracker-switcher',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isIntegrationEnabled: {
        set: function (newValue, setValue) {
          // convert to bool type. dropdown returns "true" or "false" as string
          const enabled = this.convertToBool(newValue);
          setValue(enabled);
        },
      },
      defaultTitle: {
        set: function (newValue, setValue) {
          if (newValue &&
              this.attr('setIssueTitle') &&
              this.attr('instance').isNew()) {
            this.setDefaultIssueTitle(newValue);
          }

          setValue(newValue);
        },
      },
    },
    instance: {},
    setIssueTitle: false,
    isEditIconDenied: false,
    convertToBool: function (value) {
      if (typeof value === 'boolean') {
        return value;
      }

      return !(!value || value === 'false');
    },
    inlineDropdownValueChange: function (args) {
      let dropdownValue = this.convertToBool(args.value);
      args.value = dropdownValue;
      args.type = 'issueTrackerSwitcherChanged';

      this.dispatch(args);
    },
    setDefaultIssueTitle: function (value) {
      let issueTracker = this.attr('instance.issue_tracker');

      // set from instance title
      if (issueTracker) {
        issueTracker.attr('title', value);
      }
    },
  }),
});

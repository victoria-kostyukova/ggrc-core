/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const roleToLinkMap = {
  Admin: 'owner',
  'Control Operators': 'control_operator',
  'Control Owners': 'control_owner',
  'Principal Assignees': 'principal_assignee',
  'Secondary Assignees': 'secondary_assignee',
  'Other Contacts': 'other_contact',
};

const viewModel = can.Map.extend({
  define: {
    linkAttrName: {
      get() {
        return roleToLinkMap[this.attr('roleName')];
      },
    },
  },
  roleName: '',
});

export default can.Component.extend({
  tag: 'role-attr-names-provider',
  viewModel,
});

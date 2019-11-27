/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';

const DISABLED_ROLES = ['Admin', 'Primary Contacts', 'Secondary Contacts'];
const TOOLTIP = 'Please go to the ticket and make changes there';

export default canComponent.extend({
  tag: 'issue-roles-wrapper',
  viewModel: canMap.extend({
    define: {
      disabledRoles: {
        get() {
          return this.attr('disable')
            ? DISABLED_ROLES
            : [];
        },
      },
      rolesTooltips: {
        get() {
          if (!this.attr('disable')) {
            return [];
          }

          return DISABLED_ROLES.map((role) => ({
            tooltip: TOOLTIP,
            role,
          }));
        },
      },
    },
    disable: false,
  }),
});

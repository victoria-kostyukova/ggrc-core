/*
 * Copyright (C) 2020 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canComponent from 'can-component';
import canStache from 'can-stache';
import loIncludes from 'lodash/includes';
import canDefineMap from 'can-define/map/map';

export default canComponent.extend({
  tag: 'role-avatar',
  view: canStache(
    '<span class="person-label {{lowercase mainRole}}-avatar"></span>'
  ),
  leakScope: true,
  viewModel: canDefineMap.extend({
    roles: {
      values: () => [],
    },
    person: {
      value: null,
    },
    mainRole: {
      value: 'none',
    },
    init() {
      const roleImportanceOrder = ['Creators', 'Verifiers', 'Assignees'];
      const mainRole = roleImportanceOrder.find((item) => {
        return loIncludes(this.roles, item);
      });
      this.mainRole = mainRole || 'none';
    },
  }),
});

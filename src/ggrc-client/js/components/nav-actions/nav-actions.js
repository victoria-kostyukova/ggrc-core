/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {isAllowedFor} from '../../permission';
import {peopleWithRoleName} from '../../plugins/utils/acl-utils';

const viewModel = canMap.extend({
  define: {
    canEdit: {
      get() {
        return isAllowedFor('update', this.attr('instance'));
      },
    },
    showSetupRequirement: {
      get() {
        const instance = this.attr('instance');
        return (
          this.attr('canEdit') &&
          instance.attr('status') === 'Draft' &&
          !instance.attr('can_start_cycle')
        );
      },
    },
    showMissingObjectsMessage: {
      get() {
        const instance = this.attr('instance');
        const statuses = ['Inactive', 'Draft'];
        return (
          this.attr('canEdit') &&
          !statuses.includes(instance.attr('status')) &&
          !instance.attr('can_start_cycle')
        );
      },
    },
    showAdminRequirement: {
      get() {
        const instance = this.attr('instance');
        const isRecurrentWorkflow = instance.attr('unit') !== null;
        const hasAdmins = peopleWithRoleName(instance, 'Admin').length > 0;
        const isExceptionalCase = this.attr('showMissingObjectsMessage');
        return (
          isRecurrentWorkflow &&
          !hasAdmins &&
          !isExceptionalCase
        );
      },
    },
  },
  instance: null,
});

export default canComponent.extend({
  tag: 'nav-actions',
  leakScope: true,
  viewModel,
});

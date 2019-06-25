/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../custom-roles/custom-roles-modal';
import {
  getRolesForType,
  peopleWithRoleId,
} from '../../plugins/utils/acl-utils';
import template from './access-control-list-roles-helper.stache';

export default canComponent.extend({
  tag: 'access-control-list-roles-helper',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    isNewInstance: false,
    isProposal: false,
    includeRoles: [],
    excludeRoles: [],
    readOnly: false,
    orderOfRoles: [],
    showGroupTooltip: false,
    groupTooltip: null,
    setAutoPopulatedRoles: function () {
      let instance = this.attr('instance');
      let autoPopulatedRoles =
        loFilter(getRolesForType(instance.class.model_singular), {
          default_to_current_user: true,
        });

      if (!autoPopulatedRoles.length) {
        return;
      }

      if (!instance.attr('access_control_list')) {
        instance.attr('access_control_list', []);
      }

      autoPopulatedRoles.forEach(function (role) {
        let peopleWithRole = peopleWithRoleId(instance, role.id);

        if (!peopleWithRole.length) {
          instance.attr('access_control_list').push({
            ac_role_id: role.id,
            person: {type: 'Person', id: GGRC.current_user.id},
          });
        }
      });
    },
    setupRoles() {
      if (this.attr('isNewInstance')) {
        this.setAutoPopulatedRoles();
      }
    },
  }),
  events: {
    init() {
      this.viewModel.setupRoles();
    },
    '{viewModel} instance'() {
      this.viewModel.setupRoles();
    },
  },
});

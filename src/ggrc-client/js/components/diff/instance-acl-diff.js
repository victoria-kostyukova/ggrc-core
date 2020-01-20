/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {buildModifiedACL} from '../../plugins/utils/object-history-utils';
import {getRoleById} from '../../plugins/utils/acl-utils';
import {REFRESH_PROPOSAL_DIFF} from '../../events/event-types';
import DiffBaseVM from './diff-base-vm';
import template from './templates/instance-diff-items.stache';

const viewModel = DiffBaseVM.extend({
  modifiedAcl: {},

  buildDiffObject() {
    const modifiedRoles = this.attr('modifiedAcl');
    const instance = this.attr('currentInstance');
    const currentAcl = instance.attr('access_control_list');
    const modifiedAcl = buildModifiedACL(instance, modifiedRoles);

    const rolesDiff = canMap.keys(modifiedRoles).map((roleId) => {
      let currentVal;
      let modifiedVal;

      // convert to number
      roleId = Number(roleId);
      const currentRoleAcl = this.getRoleACL(currentAcl, roleId);
      const modifiedRoleAcl = this.getRoleACL(modifiedAcl, roleId);

      const role = getRoleById(roleId);

      if (!role) {
        return;
      }

      modifiedVal = this.getEmailsOrEmpty(modifiedRoleAcl);
      currentVal = this.getEmailsOrEmpty(currentRoleAcl);

      return {
        attrName: role.name,
        currentVal,
        modifiedVal,
      };
    }).filter((diff) => !!diff);

    this.attr('diff', rolesDiff);
  },
  getRoleACL(acl, roleId) {
    return acl
      .filter((aclItem) => aclItem.ac_role_id === roleId)
      .map((aclItem) => {
        return {
          id: aclItem.person_id,
          email: aclItem.person_email,
        };
      });
  },
  getEmailsOrEmpty(value) {
    if (!value || !value.length) {
      return [this.attr('emptyValue')];
    }

    return value.map((item) => item.email).sort();
  },
});

export default canComponent.extend({
  tag: 'instance-acl-diff',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
  events: {
    buildDiff() {
      const instance = this.viewModel.attr('currentInstance');
      const modifiedACL = this.viewModel.attr('modifiedAcl');

      if (!instance || !modifiedACL) {
        return;
      }
      this.viewModel.buildDiffObject();
    },
    inserted() {
      this.buildDiff();
    },
    [`{viewModel.currentInstance} ${REFRESH_PROPOSAL_DIFF.type}`]() {
      this.buildDiff();
    },
  },
});

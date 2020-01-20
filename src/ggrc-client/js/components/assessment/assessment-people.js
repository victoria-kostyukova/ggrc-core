/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {ROLES_CONFLICT} from '../../events/event-types';
import './assessment-custom-roles';
import '../custom-roles/custom-roles-modal';
import template from './templates/assessment-people.stache';

export default canComponent.extend({
  tag: 'assessment-people',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    define: {
      emptyMessage: {
        type: 'string',
        value: '',
      },
    },
    rolesConflict: false,
    infoPaneMode: true,
    instance: {},
    mainRoles: [],
    deferredSave: null,
    isNewInstance: false,
    onStateChangeDfd: $.Deferred().resolve(),
    conflictRoles: ['Assignees', 'Verifiers'],
    orderOfRoles: ['Creators', 'Assignees', 'Verifiers'],
    setInProgress: $.noop(),
  }),
  events: {
    [`{instance} ${ROLES_CONFLICT.type}`]: function (ev, args) {
      this.viewModel.attr('rolesConflict', args.rolesConflict);
    },
  },
});

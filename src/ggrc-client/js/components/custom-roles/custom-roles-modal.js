/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/deletable-people-group';
import '../autocomplete/autocomplete-component';
import '../external-data-autocomplete/external-data-autocomplete';
import template from './templates/custom-roles-modal.stache';

export default canComponent.extend({
  tag: 'custom-roles-modal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    updatableGroupId: null,
    isNewInstance: false,
    conflictRoles: [],
    orderOfRoles: [],
    isProposal: false,
    includeRoles: [],
    excludeRoles: [],
    readOnly: false,
    showGroupTooltip: false,
    groupTooltip: null,
  }),
});

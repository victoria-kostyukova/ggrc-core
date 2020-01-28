/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../redirects/proposable-control/proposable-control';
import '../redirects/external-control/external-control';
import '../redirects/role-attr-names-provider/role-attr-names-provider';
import template from './editable-people-group-header.stache';

const ViewModel = canDefineMap.extend({
  singleUserRole: {
    value: false,
  },
  editableMode: {
    value: false,
  },
  isLoading: {
    value: false,
  },
  canEdit: {
    value: true,
  },
  required: {
    value: false,
  },
  redirectionEnabled: {
    value: false,
  },
  people: {
    value: () => [],
  },
  title: {
    value: '',
  },
  peopleCount: {
    get() {
      return this.people.length;
    },
  },
  showEditToolbar: {
    get() {
      return (this.canEdit && !this.editableMode);
    },
  },
  openEditMode: function () {
    this.dispatch('editPeopleGroup');
  },
});

export default canComponent.extend({
  tag: 'editable-people-group-header',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});

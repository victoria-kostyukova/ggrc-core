/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFind from 'lodash/find';
import loFindIndex from 'lodash/findIndex';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  isSnapshot,
} from '../../plugins/utils/snapshot-utils';
import {isAllowedFor} from '../../permission';

const ViewModel = canDefineMap.extend({seal: false}, {
  instance: {
    value: () => ({}),
  },
  isNewInstance: {
    value: false,
  },
  groupId: {
    value: '',
  },
  title: {
    value: '',
  },
  singleUserRole: {
    value: false,
  },
  people: {
    value: () => [],
  },
  isDirty: {
    value: false,
  },
  required: {
    value: false,
  },
  backUpPeople: {
    value: () => [],
  },
  autoUpdate: {
    value: false,
  },
  updatableGroupId: {
    value: null,
  },
  readOnly: {
    value: false,
  },
  isProposal: {
    value: false,
  },
  isReadonly: {
    value: false,
  },
  rolesTooltips: {
    value: () => [],
  },
  disabledRoles: {
    value: () => [],
  },
  canEdit: {
    get() {
      let instance = this.instance;
      let canEdit = !this.isReadonly &&
        !isSnapshot(instance) &&
        !instance.attr('archived') &&
        !instance.attr('_is_sox_restricted') &&
        !this.readOnly &&
        !this.updatableGroupId &&
        (
          this.isNewInstance ||
          this.isProposal ||
          isAllowedFor('update', instance)
        ) &&
        !this.isDisabledRole;

      return canEdit;
    },
  },
  isLoading: {
    get() {
      return this.updatableGroupId === this.groupId;
    },
  },
  placeholder: {
    get() {
      return this.singleUserRole ? 'Change person' : 'Add person';
    },
  },
  isDisabledRole: {
    get() {
      return this.disabledRoles.serialize().includes(this.title);
    },
  },
  tooltip: {
    get() {
      const roleTooltip = this.rolesTooltips.serialize()
        .find((roleTooltip) => roleTooltip.role === this.title);
      return roleTooltip ? roleTooltip.tooltip : '';
    },
  },
  changeEditableGroup(args) {
    if (args.editableMode) {
      this.backUpPeople = this.people.serialize();
    } else {
      this.isDirty = false;
      this.people = this.backUpPeople.serialize();
    }
  },
  saveChanges() {
    if (this.isDirty) {
      this.isDirty = false;
      this.dispatch({
        type: 'updateRoles',
        people: this.people,
        roleId: this.groupId,
        roleTitle: this.title,
      });
    }
  },
  personSelected(args) {
    this.addPerson(args.person, args.groupId);
  },
  addPerson(person, groupId) {
    let exist = loFind(this.people, {id: person.id});

    if (exist) {
      console.warn(
        `User "${person.id}" already has role "${groupId}" assigned`);
      return;
    }

    this.isDirty = true;

    if (this.singleUserRole) {
      this.people.replace([person]);
    } else {
      this.people.push(person);
    }

    if (this.autoUpdate) {
      this.saveChanges();
    }
  },
  removePerson(args) {
    let person = args.person;
    let idx = loFindIndex(this.people, {id: person.id});

    if (idx === -1) {
      console.warn(`User "${person.id}" does not present in "people" list`);
      return;
    }

    this.isDirty = true;
    this.people.splice(idx, 1);

    if (this.autoUpdate) {
      this.saveChanges();
    }
  },
});

export default canComponent.extend({
  tag: 'related-people-access-control-group',
  leakScope: true,
  ViewModel,
  events: {
    init() {
      let vm = this.viewModel;
      vm.backUpPeople = vm.people.serialize();
    },
  },
});

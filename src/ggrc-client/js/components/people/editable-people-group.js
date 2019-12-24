/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import './people-group-modal';
import './editable-people-group-header';
import '../autocomplete/autocomplete-component';
import '../external-data-autocomplete/external-data-autocomplete';
import '../person/person-data';
import peopleGroupVM from '../view-models/people-group-vm';
import {isInnerClick} from '../../plugins/ggrc-utils';
import template from './editable-people-group.stache';

const SHOW_MODAL_LIMIT = 4;

const ViewModel = peopleGroupVM.extend({
  title: {
    value: '',
  },
  canEdit: {
    value: true,
  },
  showPeopleGroupModal: {
    value: false,
  },
  updatableGroupId: {
    value: null,
  },
  editableMode: {
    set(newValue, setValue) {
      // the order of "showPeopleGroupModal" change is important
      // to avoid render of {{^showPeopleGroupModal}} block
      if (newValue) {
        this.showPeopleGroupModal = this.isModalLimitExceeded;
        setValue(newValue);
        return;
      }

      setValue(false);
      this.showPeopleGroupModal = false;
    },
  },
  isModalLimitExceeded: {
    get() {
      return this.people.length > SHOW_MODAL_LIMIT;
    },
  },
  showSeeMoreLink: {
    get() {
      return !this.editableMode &&
        !this.isLoading &&
        !this.isReadonly &&
        this.isModalLimitExceeded;
    },
  },
  /**
   * Contains people list which is displayed when editableMode is off
   * @type {Array}
   */
  showPeople: {
    get() {
      if (this.isModalLimitExceeded && !this.isReadonly) {
        return this.people.serialize().slice(0, SHOW_MODAL_LIMIT);
      }

      return this.people.serialize();
    },
  },
  /**
   * Indicates whether people group is readonly
   * canEdit becomes false while people group is saving
   * (updatableGroupId is not null in this case)
   * @type {Boolean}
   */
  isReadonly: {
    type: 'boolean',
    get() {
      return !(this.canEdit || this.updatableGroupId);
    },
  },
  personSelected(person) {
    this.dispatch({
      type: 'personSelected',
      person: person,
      groupId: this.groupId,
    });
  },
  save() {
    this.dispatch('saveChanges');
    this.editableMode = false;
  },
  cancel() {
    this.changeEditableMode(false);
  },
  changeEditableMode(editableMode) {
    this.editableMode = editableMode;
    this.dispatch({
      type: 'changeEditableMode',
      editableMode: editableMode,
      groupId: this.groupId,
    });
  },
});

export default canComponent.extend({
  tag: 'editable-people-group',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '{window} mousedown': function (el, ev) {
      let viewModel = this.viewModel;
      let isInside = isInnerClick(this.element, ev.target);
      let editableMode = viewModel.editableMode;
      let showPeopleGroupModal = viewModel.showPeopleGroupModal;

      if (!showPeopleGroupModal && !isInside && editableMode) {
        viewModel.save();
      }
    },
  },
});

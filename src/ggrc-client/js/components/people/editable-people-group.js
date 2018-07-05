/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import './people-group-modal';
import './editable-people-group-header';
import '../autocomplete/autocomplete';
import '../external-data-autocomplete/external-data-autocomplete';
import '../person/person-data';
import './people-list';
import peopleGroupVM from '../view-models/people-group-vm';
import {isInnerClick} from '../../plugins/ggrc_utils';
import template from './editable-people-group.mustache';

const SHOW_MODAL_LIMIT = 4;

let viewModel = peopleGroupVM.extend({
  title: '@',
  canEdit: {},
  showPeopleGroupModal: false,
  updatableGroupId: null,
  emptyListMessage: 'None',
  define: {
    editableMode: {
      set: function (newValue, setValue) {
        this.attr('showPeopleGroupModal',
          this.attr('isModalLimitExceeded') && newValue);
        setValue(newValue);
      },
    },
    isModalLimitExceeded: {
      get() {
        return this.attr('people.length') > SHOW_MODAL_LIMIT;
      },
    },
    showSeeMoreLink: {
      get: function () {
        return !this.attr('editableMode') &&
          !this.attr('isReadonly') &&
          this.attr('isModalLimitExceeded');
      },
    },
    /**
     * Contains people list which is displayed when editableMode is off
     * @type {can.List}
     */
    showPeople: {
      get: function () {
        if (this.attr('isModalLimitExceeded') && !this.attr('isReadonly')) {
          return this.attr('people').attr().slice(0, SHOW_MODAL_LIMIT);
        }

        return this.attr('people').attr();
      },
    },
    /**
     * Indicates whether people group is readonly
     * canEdit becomes false while people group is saving
     * (updatableGroupId is not null in this case)
     * @type {boolean}
     */
    isReadonly: {
      type: 'boolean',
      get() {
        return !(this.attr('canEdit') || this.attr('updatableGroupId'));
      },
    },
  },
  personSelected: function (person) {
    this.dispatch({
      type: 'personSelected',
      person: person,
      groupId: this.attr('groupId'),
    });
  },
  save: function () {
    this.dispatch('saveChanges');
  },
  cancel: function () {
    this.changeEditableMode(false);
  },
  changeEditableMode: function (editableMode) {
    this.attr('editableMode', editableMode);
    this.dispatch({
      type: 'changeEditableMode',
      editableMode: editableMode,
      groupId: this.attr('groupId'),
    });
  },
});

export default GGRC.Components('editablePeopleGroup', {
  tag: 'editable-people-group',
  template: template,
  viewModel: viewModel,
  events: {
    '{window} mousedown': function (el, ev) {
      let viewModel = this.viewModel;
      let isInside = isInnerClick(this.element, ev.target);
      let editableMode = viewModel.attr('editableMode');
      let showPeopleGroupModal = viewModel.attr('showPeopleGroupModal');

      if (!showPeopleGroupModal && !isInside && editableMode) {
        viewModel.save();
      }
    },
  },
});

/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import '../../inline/base-inline-control-title';
import {confirm} from '../../../plugins/utils/modals';

const EDITABLE_STATES = [
  'In Progress', 'Not Started', 'Rework Needed', 'Deprecated'];

export default canComponent.extend({
  tag: 'confirm-edit-action',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    setInProgress: null,
    editMode: false,
    isEditIconDenied: false,
    isConfirmationNeeded: true,
    onStateChangeDfd: $.Deferred().resolve(),
    openEditMode() {
      return this.attr('onStateChangeDfd').then(() => {
        if (this.isInEditableState()) {
          this.dispatch('setEditMode');
        }
      });
    },
    isInEditableState() {
      return EDITABLE_STATES.includes(this.attr('instance.status'));
    },
    showConfirm() {
      confirm({
        modal_title: 'Confirm moving Assessment to "In Progress"',
        modal_description: 'You are about to move Assessment from "' +
          this.instance.status +
          '" to "In Progress" - are you sure about that?',
        button_view: '/modals/prompt-buttons.stache',
      }, () => {
        this.dispatch('setInProgress');
        this.openEditMode();
      });
    },
    confirmEdit() {
      if (this.attr('isConfirmationNeeded') && !this.isInEditableState()) {
        this.showConfirm();
      } else {
        // send 'isLastOpenInline' when inline is opening without confirm
        this.dispatch({
          type: 'setEditMode',
          isLastOpenInline: true,
        });
      }
    },
  }),
});

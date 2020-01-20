/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import {confirm} from '../../plugins/utils/modals';

/**
 * A mixin to use for objects that can have their status automatically
 * changed when they are edited.
 *
 * @class Mixins.autoStatusChangeable
 */
export default class AutoStatusChangeable extends Mixin {
  /**
   * Display a confirmation dialog before starting to edit the instance.
   *
   * The dialog is not shown if the instance is either in the "Not Started",
   * or the "In Progress" state - in that case an already resolved promise is
   * returned.
   *
   * @return {Promise} A promise resolved/rejected if the user chooses to
   *   confirm/reject the dialog.
   */
  confirmBeginEdit() {
    let STATUS_NOT_STARTED = 'Not Started';
    let STATUS_IN_PROGRESS = 'In Progress';
    let IGNORED_STATES = [STATUS_NOT_STARTED, STATUS_IN_PROGRESS];

    let TITLE = [
      'Confirm moving ', this.type, ' to "', STATUS_IN_PROGRESS, '"',
    ].join('');

    let DESCRIPTION = [
      'If you modify a value, the status of the ', this.type,
      ' will move from "', this.status, '" to "',
      STATUS_IN_PROGRESS, '" - are you sure about that?',
    ].join('');

    let confirmation = $.Deferred();

    if (IGNORED_STATES.includes(this.status)) {
      confirmation.resolve();
    } else {
      confirm({
        modal_description: DESCRIPTION,
        modal_title: TITLE,
        button_view: '/gdrive/confirm-buttons.stache',
      }, confirmation.resolve, confirmation.reject);
    }

    return confirmation.promise();
  }
}

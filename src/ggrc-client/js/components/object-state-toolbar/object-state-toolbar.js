/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {SWITCH_TO_ERROR_PANEL, SHOW_INVALID_FIELD} from '../../events/eventTypes';
import template from './object-state-toolbar.stache';

/**
 * Object State Toolbar Component allowing Object state modification
 */
export default canComponent.extend({
  tag: 'object-state-toolbar',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      updateState: {
        get: function () {
          return this.attr('hasVerifiers') ? 'In Review' : 'Completed';
        },
      },
      isCurrentUserVerifier: {
        get: function () {
          let verifiers = this.attr('verifiers');
          return !!loFind(verifiers, (verifier) =>
            verifier.id === GGRC.current_user.id);
        },
      },
      hasVerifiers: {
        get: function () {
          return this.attr('verifiers').length;
        },
      },
    },
    instanceState: '',
    disabled: false,
    isUndoButtonVisible: false,
    verifiers: [],
    instance: {},
    isActiveState: function () {
      const activeStates = this.attr('instance').constructor.editModeStatuses;
      return activeStates.includes(this.attr('instanceState'));
    },
    isInProgress: function () {
      return this.attr('instanceState') === 'In Progress';
    },
    isInReview: function () {
      return this.attr('instanceState') === 'In Review';
    },
    changeState: function (newState, isUndo) {
      if (this.attr('instance._hasValidationErrors')) {
        this.attr('instance').dispatch(SWITCH_TO_ERROR_PANEL);
        this.attr('instance').dispatch(SHOW_INVALID_FIELD);
        return;
      }

      newState = newState || this.attr('updateState');
      this.dispatch({
        type: 'onStateChange',
        state: newState,
        undo: isUndo,
      });
    },
  }),
});

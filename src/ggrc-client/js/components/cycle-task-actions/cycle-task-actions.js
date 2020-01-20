/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import tracker from '../../tracker';
import '../spinner-component/spinner-component';
import {
  getPageType,
} from '../../plugins/utils/current-page-utils';
import template from './cycle-task-actions.stache';
import {updateStatus} from '../../plugins/utils/workflow-utils';
import {isAllowedFor} from '../../permission';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {reify} from '../../plugins/utils/reify-utils';

let viewModel = canMap.extend({
  define: {
    cycle: {
      get: function () {
        return this.attr('instance').cycle;
      },
    },
    workflow: {
      get: function () {
        return this.attr('instance.cycle.workflow');
      },
    },
    cssClasses: {
      type: String,
      get: function () {
        let classes = [];

        if (this.attr('disabled')) {
          classes.push('disabled');
        }

        return classes.join(' ');
      },
    },
    isShowActionButtons: {
      get: function () {
        const pageType = getPageType();
        const instance = this.attr('instance');

        let showButtons = isAllowedFor('update', instance);

        if (pageType === 'Workflow') {
          return showButtons && reify(this.attr('cycle')).attr('is_current');
        }

        return showButtons;
      },
    },
    isAllowedToUpdateWorkflow: {
      get: function () {
        const workflow = this.attr('instance.workflow');
        return isAllowedFor('update', workflow);
      },
    },
  },
  instance: null,
  disabled: false,
  oldValues: [],
  async changeStatus(ctx, el, ev) {
    let status = $(el).data('value');
    let instance = this.attr('instance');
    let oldValue = {
      status: instance.attr('status'),
    };

    ev.stopPropagation();
    const result = await this.setStatus(status);
    if (result) {
      this.attr('oldValues').unshift(oldValue);
    }
  },
  async undo(ctx, el, ev) {
    ev.stopPropagation();
    let previousValue = this.attr('oldValues.0');
    const result = await this.setStatus(previousValue.status);
    if (result) {
      this.attr('oldValues').shift();
    }
  },
  async setStatus(status) {
    const instance = this.attr('instance');
    const stopFn = tracker.start(
      instance.type,
      tracker.USER_JOURNEY_KEYS.LOADING,
      tracker.USER_ACTIONS.CYCLE_TASK.CHANGE_STATUS
    );
    this.attr('disabled', true);
    try {
      await updateStatus(instance, status);
      return true;
    } catch (e) {
      notifier(
        'error',
        "Task state wasn't updated due to server error. Please try again."
      );
      return false;
    } finally {
      this.attr('disabled', false);
      stopFn();
    }
  },
});

/**
 *
 */
export default canComponent.extend({
  tag: 'cycle-task-actions',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events: {
    inserted: function () {
    },
  },
});

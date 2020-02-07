/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
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

const ViewModel = canDefineMap.extend({
  cycle: {
    get() {
      return this.instance.attr('cycle');
    },
  },
  workflow: {
    get() {
      return this.instance.attr('cycle.workflow');
    },
  },
  cssClasses: {
    type: 'string',
    get() {
      let classes = [];

      if (this.disabled) {
        classes.push('disabled');
      }

      return classes.join(' ');
    },
  },
  isShowActionButtons: {
    get() {
      const pageType = getPageType();
      const instance = this.instance;

      let showButtons = isAllowedFor('update', instance);

      if (pageType === 'Workflow') {
        return showButtons && reify(this.cycle).attr('is_current');
      }

      return showButtons;
    },
  },
  isAllowedToUpdateWorkflow: {
    get() {
      const workflow = this.instance.attr('workflow');
      return isAllowedFor('update', workflow);
    },
  },
  instance: {
    value: null,
  },
  disabled: {
    value: false,
  },
  oldValues: {
    value: () => [],
  },
  async changeStatus(ctx, el, ev) {
    let status = $(el).data('value');
    let instance = this.instance;
    let oldValue = {
      status: instance.attr('status'),
    };

    ev.stopPropagation();
    const result = await this.setStatus(status);
    if (result) {
      this.oldValues.unshift(oldValue);
    }
  },
  async undo(ctx, el, ev) {
    ev.stopPropagation();
    let previousValue = this.oldValues[0];
    const result = await this.setStatus(previousValue.status);
    if (result) {
      this.oldValues.shift();
    }
  },
  async setStatus(status) {
    const instance = this.instance;
    const stopFn = tracker.start(
      instance.type,
      tracker.USER_JOURNEY_KEYS.LOADING,
      tracker.USER_ACTIONS.CYCLE_TASK.CHANGE_STATUS
    );
    this.disabled = true;
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
      this.disabled = false;
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
  ViewModel,
});

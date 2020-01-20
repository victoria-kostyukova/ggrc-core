/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {
  generateCycle,
  redirectToCycle,
} from '../../plugins/utils/workflow-utils';
import {
  initCounts,
} from '../../plugins/utils/widgets-utils';
import {refreshPermissions} from '../../permission';
import {countsMap as workflowCountsMap} from '../../apps/workflows';
import {refreshAll} from '../../models/refresh-queue';

const viewModel = canMap.extend({
  instance: {},
  waiting: false,
  async initWorkflow(workflow) {
    await workflow.refresh();
    workflow.attr({
      recurrences: true,
      status: 'Active',
    });
    return workflow.save();
  },
  async updateActiveCycleCounts(workflow) {
    return initCounts([workflowCountsMap.activeCycles],
      workflow.type, workflow.id);
  },
  async repeatOnHandler(workflow) {
    let result = Promise.resolve();
    this.attr('waiting', true);
    try {
      await this.initWorkflow(workflow);
      await refreshPermissions();
      await this.updateActiveCycleCounts(workflow);
      await refreshAll(workflow, ['task_groups', 'task_group_tasks']);
      redirectToCycle();
    } catch (err) {
      result = Promise.reject(err);
    } finally {
      this.attr('waiting', false);
    }

    return result;
  },
  async repeatOffHandler(workflow) {
    this.attr('waiting', true);
    try {
      await generateCycle(workflow);
      await workflow.refresh();
      await workflow.attr('status', 'Active').save();
      await this.updateActiveCycleCounts(workflow);
    } catch (err) {
      return Promise.reject(err);
    } finally {
      this.attr('waiting', false);
    }
  },
  async activateWorkflow() {
    const workflow = this.attr('instance');
    try {
      if (workflow.unit !== null) {
        await this.repeatOnHandler(workflow);
      } else {
        await this.repeatOffHandler(workflow);
      }
    } catch (err) {
      // Do nothing
    }
  },
});

export default canComponent.extend({
  tag: 'workflow-activate',
  leakScope: true,
  viewModel,
});

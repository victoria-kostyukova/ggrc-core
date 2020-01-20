/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/dashboard-workflows.stache';
import isFunction from 'can-util/js/is-function/is-function';
import {DATE_FORMAT, getFormattedLocalDate} from '../../plugins/utils/date-utils';
import {getTruncatedList} from '../../plugins/ggrc-utils';
import {ggrcGet} from '../../plugins/ajax-extensions';

const SHOWN_WORKFLOWS_COUNT = 5;

const viewModel = canMap.extend({
  define: {
    showAllWorkflows: {
      type: 'boolean',
      set(value) {
        const list = this.attr('shownWorkflows');
        const workflows = this.attr('workflows');

        if (value) {
          list.replace(workflows);
        } else {
          list.replace(workflows.slice(0, SHOWN_WORKFLOWS_COUNT));
        }

        return value;
      },
    },
    showToggleListButton: {
      get() {
        return this.attr('workflows.length') > SHOWN_WORKFLOWS_COUNT;
      },
    },
  },
  isLoading: false,
  workflows: [],
  shownWorkflows: [],
  toggleWorkflowList() {
    this.attr('showAllWorkflows', !this.attr('showAllWorkflows'));
  },
  convertToWorkflowList(workflowsData) {
    return workflowsData.map(({
      workflow,
      owners,
      task_stat: {counts, due_in_date: dueInDate},
    }) => ({
      workflowTitle: workflow.title,
      workflowLink: `/workflows/${workflow.id}#current`,
      owners: {
        tooltipContent: getTruncatedList(owners),
        inlineList: owners.join(', '),
      },
      taskStatistic: {
        total: counts.total,
        overdue: counts.overdue,
        dueInDate: getFormattedLocalDate(
          dueInDate,
          DATE_FORMAT.MOMENT_DISPLAY_FMT,
        ),
        completedPercent: (counts.completed * 100 / counts.total).toFixed(2),
      },
    }));
  },
  async initMyWorkflows() {
    this.attr('isLoading', true);
    const {workflows: rawWorkflows} = await ggrcGet(
      `/api/people/${GGRC.current_user.id}/my_workflows`
    );
    this.attr('isLoading', false);

    this.attr('workflows', this.convertToWorkflowList(rawWorkflows));
    this.attr('showAllWorkflows', false);
  },
});

export default canComponent.extend({
  tag: 'dashboard-workflows',
  leakScope: true,
  view: canStache(template),
  viewModel,
  init() {
    this.viewModel.initMyWorkflows();
  },
  helpers: {
    overdueCountMessage(taskStatistic) {
      const {overdue, total} = isFunction(taskStatistic) ?
        taskStatistic() : taskStatistic;
      const formOfTaskWord = total > 1
        ? 'tasks'
        : 'task';
      const formOfVerb = overdue > 1
        ? 'are'
        : 'is';

      return `${overdue} of ${total} ${formOfTaskWord} ${formOfVerb} overdue`;
    },
    totalCountMessage(totalCount) {
      totalCount = isFunction(totalCount) ? totalCount() : totalCount;
      const taskWord = totalCount > 1
        ? 'tasks'
        : 'task';
      return `${totalCount} ${taskWord} in total`;
    },
  },
});

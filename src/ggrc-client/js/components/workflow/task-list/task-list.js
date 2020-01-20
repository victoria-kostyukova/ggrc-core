/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/task-list.stache';
import Pagination from '../../base-objects/pagination';
import {isAllowedFor} from '../../../permission';
import {REFRESH_RELATED} from '../../../events/event-types';
import TaskGroupTask from '../../../models/business-models/task-group-task';

const viewModel = canMap.extend({
  TaskGroupTask,
  define: {
    paging: {
      value() {
        return new Pagination({pageSizeSelect: [5, 10, 15]});
      },
    },
    showCreateTaskButton: {
      get() {
        const workflow = this.attr('workflow');
        return (
          isAllowedFor('update', this.attr('baseInstance')) &&
          workflow && workflow.attr('status') !== 'Inactive'
        );
      },
    },
  },
  initialOrderBy: 'created_at',
  gridSpinner: 'grid-spinner',
  items: [],
  baseInstance: null,
  workflow: null,
  updatePagingAfterCreate() {
    if (this.attr('paging.current') !== 1) {
      // items will be reloaded, because the current
      // value will be changed to first page
      this.attr('paging.current', 1);
    } else {
      // reload items manually, because CanJs does not
      // trigger "change" event, when we try to set first page
      // (we are already on first page)
      this.attr('baseInstance').dispatch({
        ...REFRESH_RELATED,
        model: 'TaskGroupTask',
      });
    }
  },
  updatePagingAfterDestroy() {
    const current = this.attr('paging.current');
    const isEmptyPage = (
      current > 1 &&
      this.attr('items').length === 1
    );

    if (isEmptyPage) {
      // go to previous page
      this.attr('paging.current', current - 1);
    } else {
      // update current page
      this.attr('baseInstance').dispatch({
        ...REFRESH_RELATED,
        model: 'TaskGroupTask',
      });
    }
  },
});

const events = {
  '{TaskGroupTask} destroyed'(model, event, instance) {
    if (instance instanceof TaskGroupTask) {
      this.viewModel.updatePagingAfterDestroy();
    }
  },
  '{TaskGroupTask} created'(model, event, instance) {
    if (instance instanceof TaskGroupTask) {
      this.viewModel.updatePagingAfterCreate();
    }
  },
};

export default canComponent.extend({
  tag: 'task-list',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
});

/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/cycle-task-group-object-task.stache';
import tdmTemplate from './templates/partials/three-dots-menu.stache';
import tdmInHistoryTemplate from './templates/partials/three-dots-menu-in-history.stache';
import restoreButtonTemplate from './templates/partials/restore-button.stache';

import '../../object-change-state/object-change-state';
import '../../dropdown/dropdown-component';
import '../../comment/comment-data-provider';
import '../../comment/comment-add-form';
import '../../comment/mapped-comments';
import '../../comment/comments-paging';
import {countsMap} from '../../../apps/workflows';
import {
  initCounts,
  getCounts,
} from '../../../plugins/utils/widgets-utils';
import {
  updateStatus,
  redirectToCycle,
  redirectToHistory,
} from '../../../plugins/utils/workflow-utils';
import {
  getPageType,
} from '../../../plugins/utils/current-page-utils';
import {isAllowedFor} from '../../../permission';

let viewModel = canMap.extend({
  partials: {
    restoreButton: canStache(restoreButtonTemplate),
    threeDotsMenu: canStache(tdmTemplate),
    threeDotsMenuInHistory: canStache(tdmInHistoryTemplate),
  },
  define: {
    isAllowedToUpdate: {
      get() {
        return isAllowedFor('update', this.attr('instance'));
      },
    },
    isEditDenied: {
      get() {
        return !this.attr('isAllowedToUpdate') ||
          this.attr('instance.is_in_history');
      },
    },
    showWorkflowLink: {
      get() {
        return !this.isWorkflowPage();
      },
    },
    showMapObjectsButton: {
      get() {
        const instance = this.attr('instance');
        const status = instance.attr('status');
        const hasAllowedStatus = !(
          status === 'Verified' ||
          status === 'Finished'
        );

        return (
          !this.attr('isEditDenied') &&
          hasAllowedStatus
        );
      },
    },
    workflowLink: {
      get() {
        return `/workflows/${this.attr('instance.workflow.id')}`;
      },
    },
  },
  instance: {},
  initialState: 'Assigned',
  isWorkflowPage() {
    return getPageType() === 'Workflow';
  },
  onStateChange(event) {
    const instance = this.attr('instance');
    const status = event.state;
    const isWorkflow = this.isWorkflowPage();

    updateStatus(instance, status)
      .then(async () => {
        if (!isWorkflow) {
          return;
        }

        await initCounts(
          [countsMap.activeCycles, countsMap.history],
          instance.workflow.type, instance.workflow.id,
        );

        this.redirectFromEmptyTab();
      });
  },
  redirectFromEmptyTab() {
    const counts = getCounts();

    switch (window.location.hash) {
      case '#!current':
        if (counts['cycles:active'] === 0) {
          redirectToHistory();
        }
        break;
      case '#!history':
        if (counts['cycles:history'] === 0) {
          redirectToCycle();
        }
        break;
    }
  },
});

export default canComponent.extend({
  tag: 'cycle-task-group-object-task',
  view: canStache(template),
  leakScope: true,
  viewModel,
});

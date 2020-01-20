/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {ggrcAjax} from '../../plugins/ajax-extensions';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/generate-issues-in-bulk-button.stache';
import {isAllowedFor} from '../../permission';
import {notifier} from '../../plugins/utils/notifiers-utils';
import Stub from '../../models/stub';
import {handleAjaxError} from '../../plugins/utils/errors-utils';
import pubSub from '../../pub-sub';

const DEFAULT_TIMEOUT = 2000;
const MAX_TIMEOUT = 60000;

export default canComponent.extend({
  tag: 'generate-issues-in-bulk-button',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isAllowedToGenerate: {
        get() {
          return isAllowedFor('update', this.attr('instance'));
        },
      },
      disableButton: {
        get() {
          return this.attr('isGettingInitialStatus') ||
            this.attr('isGeneratingInProgress');
        },
      },
    },
    instance: {},
    isGeneratingInProgress: false,
    isGettingInitialStatus: false,
    timeoutId: null,
    getStatus() {
      let url = '/background_task_status/' +
        `${this.attr('instance.type')}/${this.attr('instance.id')}`;

      return ggrcAjax({
        method: 'GET',
        url,
        cache: false,
      });
    },
    generateChildrenIssues() {
      return ggrcAjax({
        method: 'POST',
        url: '/generate_children_issues',
        data: JSON.stringify({
          parent: new Stub(this.attr('instance')).serialize(),
          child_type: 'Assessment',
        }),
        dataType: 'json',
        contentType: 'application/json',
      });
    },
    generate() {
      this.attr('isGeneratingInProgress', true);

      this.generateChildrenIssues()
        .done((resp) => {
          notifier('progress', `Tickets will be generated using a background
            job and linked to assessments. An email notification will be sent
            to you once this process is complete or if there are errors.`);
          this.trackStatus(DEFAULT_TIMEOUT);
        })
        .fail((jqxhr, textStatus, errorThrown) => {
          this.attr('isGeneratingInProgress', false);
          handleAjaxError(jqxhr, errorThrown);
        });
    },
    trackStatus(timeout) {
      timeout = timeout > MAX_TIMEOUT ? MAX_TIMEOUT : timeout;

      let timeoutId = setTimeout(() => {
        this.checkStatus(timeout);
      }, timeout);

      this.attr('timeoutId', timeoutId);
    },
    onSuccessHandler(errors) {
      if (errors && errors.length) {
        notifier('error', 'There were some errors in generating ' +
          'tickets. More details will be sent by email.');
        return;
      }

      const reloadLink = window.location.origin +
        `/audits/${this.attr('instance.id')}#!assessment`;

      notifier('success', 'Tickets were generated successfully. {reload_link}',
        {reloadLink});

      // need to refresh tree view with Ticket Tracker column
      pubSub.dispatch({
        type: 'refetchOnce',
        modelNames: ['Assessment'],
      });
    },
    checkStatus(timeout) {
      this.getStatus()
        .done((task) => {
          let status = task.status;

          switch (status) {
            case 'Running':
            case 'Pending': {
              this.trackStatus(timeout * 2);
              break;
            }
            case 'Success': {
              this.onSuccessHandler(task.errors);

              this.attr('isGeneratingInProgress', false);
              break;
            }
            case 'Failure': {
              notifier('error', 'There were some errors in generating ' +
                'tickets.');
              this.attr('isGeneratingInProgress', false);
              break;
            }
          }
        });
    },

    checkInitialStatus() {
      this.attr('isGettingInitialStatus', true);
      this.getStatus()
        .done((resp) => {
          let status = resp.status;

          if (status === 'Running' || status === 'Pending') {
            this.attr('isGeneratingInProgress', true);
            this.trackStatus(DEFAULT_TIMEOUT);
          }
        })
        .fail((jqxhr, textStatus, errorThrown) => {
          if (jqxhr && jqxhr.status === 404) {
            // There is no background tasks for current audit
            return;
          }

          handleAjaxError(jqxhr, errorThrown);
        })
        .always(() => {
          this.attr('isGettingInitialStatus', false);
        });
    },
  }),
  events: {
    inserted() {
      if (this.viewModel.attr('isAllowedToGenerate')) {
        this.viewModel.checkInitialStatus();
      }
    },
    removed() {
      let timeoutId = this.viewModel.attr('timeoutId');
      clearTimeout(timeoutId);
    },
  },
});

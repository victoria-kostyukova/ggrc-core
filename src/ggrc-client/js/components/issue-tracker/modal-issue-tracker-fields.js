/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../dropdown/dropdown-component';
import '../numberbox/numberbox-component';
import './modal-component-id';
import {loadComponentIds} from '../../plugins/utils/issue-tracker-utils';
import template from './templates/modal-issue-tracker-fields.stache';

const state = {
  NOT_SELECTED: 0,
  GENERATE_NEW: 1,
  LINK_TO_EXISTING: 2,
  LINKED: 3,
};

export default canComponent.extend({
  tag: 'modal-issue-tracker-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      displayFields: {
        get() {
          return this.attr('instance.issue_tracker.enabled') &&
            this.attr('currentState') !== state.NOT_SELECTED;
        },
      },
      isGenerateNewState: {
        get() {
          return this.attr('currentState') === state.GENERATE_NEW;
        },
      },
    },
    instance: {},
    note: '',
    mandatoryTicketIdNote: '',
    isTicketIdMandatory: false,
    componentIdsLoading: false,
    componentIds: [],
    state,
    currentState: state.NOT_SELECTED,
    generateNewTicket() {
      if (this.attr('currentState') === state.GENERATE_NEW) {
        return;
      }

      if (!this.attr('componentIds').length) {
        this.loadComponentIds();
      }

      this.attr('currentState', state.GENERATE_NEW);
      this.setValidationFlags({linking: false, initialized: true});

      this.attr('instance').setDefaultHotlistAndComponent();
      this.attr('instance.issue_tracker.issue_id', null);
    },
    linkToExistingTicket() {
      if (this.attr('currentState') === state.LINK_TO_EXISTING) {
        return;
      }

      this.attr('currentState', state.LINK_TO_EXISTING);
      this.setValidationFlags({linking: true, initialized: true});

      this.attr('instance.issue_tracker').attr({
        issue_id: null,
        hotlist_id: null,
        component_id: null,
      });
    },
    setTicketIdMandatory() {
      let instance = this.attr('instance');

      if (instance.constructor.unchangeableIssueTrackerIdStatuses) {
        this.attr('isTicketIdMandatory',
          instance.constructor.unchangeableIssueTrackerIdStatuses
            .includes(instance.attr('status')));
      }
    },
    setValidationFlags({initialized, linking}) {
      this.attr('instance.issue_tracker').attr({
        is_linking: linking,
        _initialized: initialized,
      });
    },
    statusChanged() {
      this.setTicketIdMandatory();

      if (this.attr('currentState') === state.GENERATE_NEW &&
        this.attr('isTicketIdMandatory')) {
        this.linkToExistingTicket();
      }
    },
    loadComponentIds() {
      this.attr('componentIdsLoading', true);

      return loadComponentIds().then((ids) => {
        this.attr('componentIds', ids);
      }).finally(() => {
        this.attr('componentIdsLoading', false);
      });
    },
  }),
  events: {
    inserted() {
      let vm = this.viewModel;

      vm.setTicketIdMandatory();
      if (vm.attr('instance').issueCreated()) {
        vm.attr('currentState', state.LINKED);
        vm.setValidationFlags({initialized: true, linking: false});
        return;
      }

      vm.setValidationFlags({initialized: false, linking: false});
    },
    '{viewModel.instance} status'() {
      this.viewModel.statusChanged();
    },
    removed() {
      let instance = this.viewModel.attr('instance');
      if (instance) {
        instance.removeAttr('issue_tracker.is_linking');
        instance.removeAttr('issue_tracker._initialized');
      }
    },
  },
});

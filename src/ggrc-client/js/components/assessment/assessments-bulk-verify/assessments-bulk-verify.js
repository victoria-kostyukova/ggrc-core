/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import template from './assessments-bulk-verify.stache';
import AssessmentsBulkUpdate from '../view-models/assessments-bulk-updatable-vm';
import {STATES_KEYS} from '../../../plugins/utils/state-utils';
import {request} from '../../../plugins/utils/request-utils';

const ViewModel = AssessmentsBulkUpdate.extend({
  isVerifyButtonDisabled: {
    get() {
      return (
        this.selected.length === 0 ||
        this.isVerifying
      );
    },
  },
  statesCollectionKey: {
    value: () => STATES_KEYS.BULK_VERIFY,
  },
  isVerifying: {
    value: false,
  },
  filterOperatorOptions: {
    value: null,
  },
  async onVerifyClick() {
    this.isVerifying = true;
    try {
      const {id} = await request('/api/bulk_operations/verify', {
        assessments_ids: this.getSelectedAssessmentsIds(),
      });
      this.trackBackgroundTask(id);
      this.closeModal();
    } catch (err) {
      this.handleBulkUpdateErrors();
    } finally {
      this.isVerifying = false;
    }
  },
  init() {
    const attributeFilter = {
      attribute: {
        field: 'Verifiers',
        operator: '~',
        value: GGRC.current_user.email,
      },
      options: {
        disabled: true,
      },
    };
    const operatorOptions = {
      disabled: true,
    };

    // disable ability to change default operator for all of the attributes
    // in advanced search (except in grouped filter)
    this.filterOperatorOptions = operatorOptions;

    this.initDefaultFilter(attributeFilter, operatorOptions);
    this.initFilterAttributes();
  },
});

const events = {
  inserted() {
    this.viewModel.element = this.element;
    this.viewModel.onSubmit();
  },
};

export default canComponent.extend({
  tag: 'assessments-bulk-verify',
  view: canStache(template),
  ViewModel,
  events,
});

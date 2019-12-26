/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import template from './assessments-bulk-verify-button.stache';
import BulkUpdatableButton from '../view-models/bulk-updatable-button-vm';

const ViewModel = BulkUpdatableButton.extend({
  isButtonView: {
    value: false,
  },
  async openBulkVerifyModal(el) {
    const {AssessmentsBulkVerify} = await import(
      /* webpackChunkName: "mapper" */
      '../../../controllers/mapper/mapper'
    );

    AssessmentsBulkVerify.launch($(el), this.getModalConfig());
  },
});

export default canComponent.extend({
  tag: 'assessments-bulk-verify-button',
  view: canStache(template),
  ViewModel,
});

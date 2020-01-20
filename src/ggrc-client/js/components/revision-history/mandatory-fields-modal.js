/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../simple-modal/simple-modal';
import '../gca-controls/gca-controls';
import template from './templates/mandatory-fields-modal.stache';

export default canComponent.extend({
  tag: 'mandatory-fields-modal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      showCAs: {
        type: 'boolean',
        get() {
          return this.attr('caFields').length;
        },
      },
      isApplyButtonDisabled: {
        type: Boolean,
        get() {
          let hasErrors = this.instance.computed_unsuppressed_errors();
          return hasErrors || this.attr('loading');
        },
      },
    },
    instance: null,
    state: {
      open: false,
    },
    revisionModifiedBy: null,
    revisionUpdatedAt: null,
    loading: false,
    caFields: [],
    initModal() {
      let caFields = this.getInvalidCAsFields();
      this.attr('caFields', caFields);
    },
    getInvalidCAsFields() {
      let instance = this.attr('instance');
      return instance.customAttr()
        .filter((attr) => attr.validationState.hasGCAErrors);
    },
    save() {
      let instance = this.attr('instance');
      if (!instance.computed_unsuppressed_errors()) {
        this.attr('loading', true);
        this.dispatch('save');
      }
    },
    cancel() {
      this.dispatch('cancel');
      this.attr('state.open', false);
    },
  }),
  events: {
    '{viewModel.state} open'() {
      if (this.viewModel.state.open) {
        this.viewModel.initModal();
      }
    },
  },
});

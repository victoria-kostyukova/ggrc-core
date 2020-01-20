/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './simple-modal.stache';

/**
 * Simple Modal Component is a general abstraction to visualize
 * modal and pop-ups with overlay.
 * Simple Modal can be initialized in any part of the HTML.
 * Simple Modal provides only logic less basic markup. All business logic should be placed on the level of inner components.
 * To simplify styling additional helper CSS classes were created: 'simple-modal__footer', 'simple-modal__body' and 'simple-modal__header'
 */
export default canComponent.extend({
  tag: 'simple-modal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    extraCssClass: '',
    instance: {},
    modalTitle: '',
    replaceContent: false,
    isDisabled: false,
    modalWrapper: null,
    state: {
      open: false,
    },
    hide: function () {
      if (this.attr('state.open')) {
        this.attr('state.open', false);
        this.dispatch('hide');
      }
    },
    show: function () {
      this.attr('state.open', true);
    },
    showHideModal(showModal) {
      const $modalWrapper = this.attr('modalWrapper');
      if (showModal) {
        $modalWrapper.modal().on('hidden.bs.modal', this.hide.bind(this));
      } else {
        $modalWrapper.modal('hide').off('hidden.bs.modal');
      }
    },
  }),
  events: {
    inserted() {
      const viewModel = this.viewModel;
      const modalWrapper = this.element
        .find('[data-modal-wrapper-target="true"]');
      viewModel.attr('modalWrapper', modalWrapper);
      viewModel.showHideModal(viewModel.attr('state.open'));
    },
    removed() {
      this.viewModel.hide();
    },
    '{viewModel.state} open'(state, ev, newValue) {
      this.viewModel.showHideModal(newValue);
    },
  },
});

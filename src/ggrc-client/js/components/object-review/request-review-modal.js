/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/request-review-modal.stache';
import {
  createReviewInstance,
  saveReview,
} from '../../plugins/utils/object-review-utils';
import {REFRESH_COMMENTS} from '../../events/event-types';

export default canComponent.extend({
  tag: 'request-review-modal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isValidForm: {
        get() {
          return !!this.attr('review.access_control_list.length');
        },
      },
      disabled: {
        get() {
          return this.attr('loading') || !this.attr('isValidForm');
        },
      },
    },
    parentInstance: null,
    loading: false,
    review: null,
    reviewEmailMessage: null,
    modalState: {
      open: false,
    },
    prepareModalContent() {
      let review = this.attr('review');

      if (!review) {
        const parentInstance = this.attr('parentInstance');

        review = createReviewInstance(parentInstance);
        this.attr('review', review);
      }
      // Backup Review because in other case restore on cancel will not work properly
      review.backup();
    },
    cancel() {
      this.attr('modalState.open', false);
      this.attr('review').restore(true);
      this.attr('reviewEmailMessage', null);
    },
    save() {
      if (!this.attr('isValidForm')) {
        return;
      }

      const review = this.attr('review');

      this.attr('loading', true);
      review.attr('status', 'Unreviewed');
      review.attr('email_message', this.attr('reviewEmailMessage'));

      saveReview(review, this.attr('parentInstance'))
        .then((review) => {
          this.attr('modalState.open', false);
          this.attr('reviewEmailMessage', null);
          this.dispatch({
            type: 'reviewersUpdated',
            review,
          });
          this.attr('parentInstance').dispatch(REFRESH_COMMENTS);
        })
        .always(() => {
          this.attr('loading', false);
        });
    },
  }),
  events: {
    '{viewModel.modalState} open'() {
      if (this.viewModel.attr('modalState.open')) {
        this.viewModel.prepareModalContent();
      }
    },
  },
});

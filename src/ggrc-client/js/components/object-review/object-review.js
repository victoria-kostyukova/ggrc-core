/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/object-review.mustache';
import Review from '../../models/service-models/review';
const tag = 'object-review';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    define: {
      reviewStatus: {
        get() {
          let status = this.attr('review.status') ||
            this.attr('instance.review_status');

          return status.toLowerCase();
        },
      },
    },
    instance: {},
    review: null,
    loading: false,
    initReview() {
      let review = this.attr('instance.review');

      if (!review) {
        return;
      }

      this.refreshReview(new Review(review));
    },
    refreshReview(review) {
      review.refresh().then((reviewInstance) => {
        this.attr('review', reviewInstance);
      });
    },
  },
  events: {
    inserted() {
      this.viewModel.initReview();
    },
  },
});

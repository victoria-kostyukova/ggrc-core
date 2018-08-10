/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/object-review.mustache';
import Review from '../../models/service-models/review';
import Permission from '../../permission';
import {isSnapshot} from '../../plugins/utils/snapshot-utils';
import {createReviewInstance, saveReview} from '../../plugins/utils/object-review-utils';
import {REFRESH_MAPPING, DESTINATION_UNMAPPED} from '../../events/eventTypes';
import {getRole} from '../../plugins/utils/acl-utils';

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
      isReviewed: {
        get() {
          return this.attr('reviewStatus') === 'reviewed';
        },
      },
      wasReviewed: {
        get() {
          return !!this.attr('review.last_reviewed_by');
        },
      },
      showButtons: {
        get() {
          return !this.attr('isReviewed') &&
            !isSnapshot(this.attr('instance')) &&
            this.attr('hasUpdatePermission');
        },
      },
      hasUpdatePermission: {
        get() {
          const instance = this.attr('review') || this.attr('instance');

          return Permission.is_allowed_for('update', instance);
        },
      },
      hasReviewers: {
        get() {
          return this.attr('review.access_control_list.length');
        },
      },
    },
    instance: {},
    review: null,
    loading: false,
    loadReview() {
      const review = this.attr('instance.review');

      if (review) {
        this.attr('loading', true);

        new Review(review)
          .refresh()
          .then((reviewInstance) => {
            this.attr('review', reviewInstance);
            this.attr('loading', false);
          });
      }
    },
    getReviewInstance() {
      const review = this.attr('review');

      return review || createReviewInstance(this.attr('instance'));
    },
    markReviewed() {
      const review = this.getReviewInstance();

      this.updateAccessControlList(review);
      this.changeReviewState(review, 'Reviewed');
    },
    changeReviewState(review, status) {
      review.attr('status', status);
      this.attr('loading', true);

      return this.updateReview(review).then(() => {
        this.attr('loading', false);
      });
    },
    updateReview(review) {
      return saveReview(review, this.attr('instance'))
        .then((reviewInstance) => {
          this.attr('review', reviewInstance);
        });
    },
    isCurrentUserReviewer(acl) {
      const currentUser = acl.filter((item) =>
        item.person.id === GGRC.current_user.id);

      return !!currentUser.length;
    },
    updateAccessControlList(review) {
      const acl = review.attr('access_control_list');

      if (!this.isCurrentUserReviewer(acl)) {
        const reviewerRole = getRole('Review', 'Reviewer');

        acl.push({
          ac_role_id: reviewerRole.id,
          person: {type: 'Person', id: GGRC.current_user.id},
        });
      }
    },
  },
  events: {
    inserted() {
      this.viewModel.loadReview();
    },
    '{viewModel.instance} modelAfterSave'() {
      this.viewModel.loadReview();
    },
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`](instance, event) {
      // check destinationType because REFRESH_MAPPING is also dispatched on modal 'hide'
      if (event.destinationType) {
        this.viewModel.loadReview();
      }
    },
    [`{viewModel.instance} ${DESTINATION_UNMAPPED.type}`]() {
      this.viewModel.loadReview();
    },
  },
});

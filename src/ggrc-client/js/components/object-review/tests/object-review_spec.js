/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../object-review';
import Review from '../../../models/service-models/review';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';
import * as ObjectReviewUtils from '../../../plugins/utils/object-review-utils';
import Permission from '../../../permission';
import * as AclUtils from '../../../plugins/utils/acl-utils';

describe('object-review component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"reviewStatus" getter', () => {
    it('should return status from review object', () => {
      const review = {
        status: 'review_status',
      };
      viewModel.attr('review', review);

      expect(viewModel.attr('reviewStatus')).toBe(review.status);
    });

    it('should return status in lower case', () => {
      const review = {
        status: 'Review_Status',
      };

      viewModel.attr('review', review);

      expect(viewModel.attr('reviewStatus')).toBe(review.status.toLowerCase());
    });
  });

  describe('"isReviewed" getter', () => {
    it('should return true if status is equal "reviewed"', () => {
      viewModel.attr('review', {status: 'Reviewed'});

      expect(viewModel.attr('isReviewed')).toBeTruthy();
    });

    it('should return false if status is equal "unreviewed"', () => {
      viewModel.attr('review', {status: 'Unreviewed'});

      expect(viewModel.attr('isReviewed')).toBeFalsy();
    });
  });

  describe('"wasReviewed" getter', () => {
    it(`should return true if "last_reviewed_by"
     contains info about person`, () => {
      const review = {
        last_reviewed_by: {id: 5},
      };
      viewModel.attr('review', review);

      expect(viewModel.attr('wasReviewed')).toBeTruthy();
    });

    it('should return false if "last_reviewed_by" is empty', () => {
      const review = {
        last_reviewed_by: null,
      };
      viewModel.attr('review', review);

      expect(viewModel.attr('wasReviewed')).toBeFalsy();
    });
  });

  describe('"hasReviewers" getter', () => {
    it('should return true if ACL is not empty', () => {
      const review = {
        access_control_list: [{id: 5}],
      };
      viewModel.attr('review', review);

      expect(viewModel.attr('hasReviewers')).toBeTruthy();
    });

    it('should return false if ACL is empty', () => {
      const review = {
        access_control_list: [],
      };
      viewModel.attr('review', review);

      expect(viewModel.attr('hasReviewers')).toBeFalsy();
    });
  });

  describe('"showButtons" getter', () => {
    let review;
    let instance;

    beforeEach(() => {
      instance = {
        snapshot: false,
        isRevision: false,
      };
      review = {
        status: 'Unreviewed',
      };

      viewModel.attr({
        instance,
        review,
      });
    });

    it('should return true', () => {
      spyOn(Permission, 'is_allowed_for').and.returnValue(true);

      expect(viewModel.attr('showButtons')).toBeTruthy();
    });

    it('should return false if instance is snapshot', () => {
      viewModel.attr('instance.snapshot', true);
      spyOn(Permission, 'is_allowed_for').and.returnValue(true);

      expect(viewModel.attr('showButtons')).toBeFalsy();
    });

    it('should return false if instance is revision', () => {
      viewModel.attr('instance.isRevision', true);
      spyOn(Permission, 'is_allowed_for').and.returnValue(true);

      expect(viewModel.attr('showButtons')).toBeFalsy();
    });

    it('should return false if object is reviewed', () => {
      viewModel.attr('review.status', 'Reviewed');
      spyOn(Permission, 'is_allowed_for').and.returnValue(true);

      expect(viewModel.attr('showButtons')).toBeFalsy();
    });

    it('should return false if user doesn\'t have "update" permissions', () => {
      viewModel.attr('hasUpdatePermission', false);
      spyOn(Permission, 'is_allowed_for').and.returnValue(false);

      expect(viewModel.attr('showButtons')).toBeFalsy();
    });
  });

  describe('markReviewed() method', () => {
    let review;
    let changeReviewDfd;

    beforeEach(() => {
      review = new Review();
      viewModel.attr('review', review);

      changeReviewDfd = can.Deferred();
      viewModel.changeReviewState = () => changeReviewDfd;
      review.attr('status', 'Unreviewed');

      spyOn(viewModel, 'showNotification');
      spyOn(viewModel, 'changeReviewState').and.callThrough();
      spyOn(viewModel, 'updateAccessControlList');
    });


    it('should update acl', () => {
      viewModel.markReviewed();

      expect(viewModel.updateAccessControlList).toHaveBeenCalled();
    });

    it('should call changeReviewState method', () => {
      viewModel.markReviewed();

      expect(viewModel.changeReviewState)
        .toHaveBeenCalledWith(review, 'Reviewed');
    });


    it('should show notification', (done) => {
      viewModel.markReviewed();

      changeReviewDfd.resolve();
      changeReviewDfd.then(() => {
        expect(viewModel.showNotification).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('markUnreviewed() method', () => {
    let review;
    let changeReviewDfd;

    beforeEach(() => {
      review = new Review();
      viewModel.attr('review', review);

      changeReviewDfd = can.Deferred();
      viewModel.changeReviewState = () => changeReviewDfd;
      review.attr('status', 'Reviewed');

      spyOn(viewModel, 'showNotification');
      spyOn(viewModel, 'changeReviewState').and.callThrough();
      spyOn(viewModel, 'updateAccessControlList');
    });


    it('should not update acl', () => {
      viewModel.markUnreviewed();

      expect(viewModel.updateAccessControlList).not.toHaveBeenCalled();
    });

    it('should call changeReviewState method', () => {
      viewModel.markUnreviewed();

      expect(viewModel.changeReviewState)
        .toHaveBeenCalledWith(review, 'Unreviewed');
    });

    it('should not show notification', (done) => {
      viewModel.markUnreviewed();

      changeReviewDfd.resolve();
      changeReviewDfd.then(() => {
        expect(viewModel.showNotification).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('changeReviewState() method', () => {
    let review;
    let updateReviewDfd;

    beforeEach(() => {
      review = new Review();
      viewModel.attr('review', review);

      updateReviewDfd = can.Deferred();
      viewModel.updateReview = () => updateReviewDfd;

      spyOn(viewModel, 'showNotification');
    });

    it('should show loader', (done) => {
      viewModel.changeReviewState(review, 'Reviewed');

      expect(viewModel.attr('loading')).toBeTruthy();

      updateReviewDfd.resolve(review);
      updateReviewDfd.then(() => {
        expect(viewModel.attr('loading')).toBeFalsy();
        done();
      });
    });

    it('should set correct Reviewed state', (done) => {
      expect(review.attr('status')).not.toEqual('Reviewed');

      viewModel.changeReviewState(review, 'Reviewed');
      updateReviewDfd.resolve(review);
      updateReviewDfd.then(() => {
        expect(review.attr('status')).toEqual('Reviewed');
        done();
      });
    });

    it('should set correct Unreviewed state', (done) => {
      review.attr('status', 'Reviewed');

      viewModel.changeReviewState(review, 'Unreviewed');
      updateReviewDfd.resolve(review);
      updateReviewDfd.then(() => {
        expect(review.attr('status')).toEqual('Unreviewed');
        done();
      });
    });
  });

  describe('updateReview() method', () => {
    let review;

    beforeEach(() => {
      const saveDfd = new can.Deferred();

      review = new Review();
      spyOn(ObjectReviewUtils, 'saveReview')
        .and.returnValue(saveDfd.resolve(review));
    });

    it('should call "saveReview" function', () => {
      spyOn(review, 'isNew').and.returnValue(true);

      viewModel.updateReview(review);
      expect(ObjectReviewUtils.saveReview).toHaveBeenCalled();
    });

    it('should set review from response to attr', () => {
      spyOn(review, 'isNew').and.returnValue(true);

      expect(viewModel.attr('review')).not.toEqual(review);
      viewModel.updateReview(review);
      expect(viewModel.attr('review')).toEqual(review);
    });
  });

  describe('showNotification() method', () => {
    beforeEach(() => {
      spyOn(NotifiersUtils, 'notifier');
    });

    it('should call notifier', () => {
      viewModel.showNotification();

      expect(NotifiersUtils.notifier).toHaveBeenCalledWith('info',
        jasmine.any(String),
        jasmine.objectContaining({
          revertState: jasmine.any(Function),
        }));
    });
  });

  describe('updateAccessControlList() method', () => {
    const reviewerRole = {id: 10, name: 'Reviewers', object_type: 'Review'};
    let review;
    let currentUser;
    let expected;

    beforeEach(() => {
      review = new Review();
      currentUser = {type: 'Person', id: GGRC.current_user.id};
      expected = [{ac_role_id: reviewerRole.id, person: currentUser}];
      spyOn(AclUtils, 'getRole').and.returnValue(reviewerRole);
    });

    it('should add current user to acl if he is not in the list yet', () => {
      review.attr('access_control_list', []);

      viewModel.updateAccessControlList(review);
      const result = review.attr('access_control_list');

      expect(result.serialize()).toEqual(expected);
    });

    it('should not add user to acl if he is already in the list', () => {
      review.attr('access_control_list', expected);

      viewModel.updateAccessControlList(review);
      const result = review.attr('access_control_list');

      expect(result.serialize()).toEqual(expected);
    });
  });
});

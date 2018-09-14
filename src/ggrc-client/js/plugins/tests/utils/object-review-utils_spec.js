/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {saveReview} from '../../../plugins/utils/object-review-utils';
import Review from '../../../models/service-models/review';
import Permission from '../../../permission';

describe('object-review-utils', () => {
  let review;
  let reviewableInstance;

  beforeEach(() => {
    review = new Review();
  });

  describe('saveReview() method', () => {
    beforeEach(() => {
      const saveDfd = new can.Deferred();
      const refreshDfd = new can.Deferred();

      spyOn(review, 'save').and.returnValue(saveDfd.resolve(review));
      spyOn(review, 'refresh').and.returnValue(refreshDfd.resolve(review));
      spyOn(Permission, 'refresh').and.returnValue($.when());
      reviewableInstance = jasmine.createSpyObj('reviewableInstance',
        {refresh: $.when()});
    });

    describe('if the Review model is new', () => {
      beforeEach(() => {
        spyOn(review, 'isNew').and.returnValue(true);
      });

      it('should save and refresh review', () => {
        saveReview(review, reviewableInstance);
        expect(review.save).toHaveBeenCalled();
        expect(review.refresh).toHaveBeenCalled();
      });

      it('should refresh Permissions and reviewable object', () => {
        saveReview(review, reviewableInstance);
        expect(Permission.refresh).toHaveBeenCalled();
        expect(reviewableInstance.refresh).toHaveBeenCalled();
      });
    });

    describe('if the Review model exists', () => {
      beforeEach(() => {
        spyOn(review, 'isNew').and.returnValue(false);
      });

      it('should save without review refresh', () => {
        saveReview(review, reviewableInstance);
        expect(review.save).toHaveBeenCalled();
        expect(review.refresh).not.toHaveBeenCalled();
      });

      it('should not refresh Permissions and reviewable object', () => {
        saveReview(review, reviewableInstance);
        expect(Permission.refresh).not.toHaveBeenCalled();
        expect(reviewableInstance.refresh).not.toHaveBeenCalled();
      });
    });
  });
});

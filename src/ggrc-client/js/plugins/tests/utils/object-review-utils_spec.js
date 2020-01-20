/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {saveReview} from '../../../plugins/utils/object-review-utils';
import Review from '../../../models/service-models/review';
import * as Permission from '../../../permission';

describe('object-review-utils', () => {
  let review;
  let reviewableInstance;

  beforeEach(() => {
    review = new Review();
  });

  describe('saveReview() method', () => {
    beforeEach(() => {
      const saveDfd = new $.Deferred();
      const refreshDfd = new $.Deferred();

      spyOn(review, 'save').and.returnValue(saveDfd.resolve(review));
      spyOn(review, 'refresh').and.returnValue(refreshDfd.resolve(review));
      spyOn(Permission, 'refreshPermissions').and.returnValue($.when());
      reviewableInstance = jasmine.createSpyObj('reviewableInstance',
        {refresh: $.when()});
    });

    describe('if the Review model is new', () => {
      beforeEach(() => {
        spyOn(review, 'isNew').and.returnValue(true);
      });

      it('should save and refresh review', (done) => {
        saveReview(review, reviewableInstance).then(() => {
          expect(review.save).toHaveBeenCalled();
          expect(review.refresh).toHaveBeenCalled();
          done();
        });
      });

      it('should refresh Permissions and reviewable object', (done) => {
        saveReview(review, reviewableInstance).then(() => {
          expect(Permission.refreshPermissions).toHaveBeenCalled();
          expect(reviewableInstance.refresh).toHaveBeenCalled();
          done();
        });
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
        expect(Permission.refreshPermissions).not.toHaveBeenCalled();
        expect(reviewableInstance.refresh).not.toHaveBeenCalled();
      });
    });
  });
});

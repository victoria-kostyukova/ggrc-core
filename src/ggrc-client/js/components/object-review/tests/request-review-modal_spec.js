/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../request-review-modal';
import Review from '../../../models/service-models/review';

describe('request-review-modal component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"isValidForm" getter', () => {
    beforeEach(() => {
      const review = new Review();

      viewModel.attr('review', review);
    });

    it('should return flase if ACL is empty', () => {
      expect(viewModel.attr('isValidForm')).toBeFalsy();
    });

    it('should return true if ACL is not empty', () => {
      viewModel.attr('review.access_control_list', [{person_id: 1}]);

      expect(viewModel.attr('isValidForm')).toBeTruthy();
    });
  });

  describe('"disabled" getter', () => {
    beforeEach(() => {
      const review = new Review();

      viewModel.attr({loading: false, review});
    });

    describe('if ACL is empty', () => {
      it('should return true', () => {
        expect(viewModel.attr('disabled')).toBeTruthy();
      });
    });

    describe('if ACL is not empty', () => {
      beforeEach(() => {
        viewModel.attr('review.access_control_list', [{person_id: 1}]);
      });

      it('should return false', () => {
        expect(viewModel.attr('disabled')).toBeFalsy();
      });

      it('should return true if loading attr is set to true', () => {
        viewModel.attr('loading', true);

        expect(viewModel.attr('disabled')).toBeTruthy();
      });
    });
  });

  describe('save() method', () => {
    const originalEmailComment = 'email comment...';
    const newACL = [{person_id: 1}];
    let saveDfd;
    let review;
    beforeEach(() => {
      saveDfd = can.Deferred();
      review = new Review({
        access_control_list: [],
        email_message: originalEmailComment,
      });

      spyOn(review, 'isNew').and.returnValue(false);
      spyOn(review, 'save').and.returnValue(saveDfd);

      viewModel.attr('review', review);
      viewModel.attr('modalState.open', true);
    });

    it('should not save review in case of empty ACL', () => {
      viewModel.save();

      expect(review.save).not.toHaveBeenCalled();
    });

    it('should update ACL', (done) => {
      expect(viewModel.attr('review.access_control_list').serialize())
        .toEqual([]);

      review.attr('access_control_list', newACL);
      viewModel.save();

      saveDfd.then(() => {
        expect(review.save).toHaveBeenCalled();
        expect(viewModel.attr('review.access_control_list').serialize())
          .toEqual(newACL);
        done();
      });
      saveDfd.resolve(review);
    });

    it('should update "Email" notification text', (done) => {
      viewModel.attr('review.access_control_list', newACL);

      const newEmailMessage = 'NEW EMAIL MESSAGE!';

      expect(viewModel.attr('review.email_message'))
        .toEqual(originalEmailComment);

      review.attr('email_message', newEmailMessage);
      viewModel.save();

      saveDfd.then(() => {
        expect(review.save).toHaveBeenCalled();
        expect(viewModel.attr('review.email_message'))
          .toEqual(newEmailMessage);
        done();
      });
      saveDfd.resolve(review);
    });

    it('should set Unreviewed status', (done) => {
      viewModel.attr('review.access_control_list', newACL);
      viewModel.attr('review.status', 'Reviewed');

      viewModel.save();

      saveDfd.then(() => {
        expect(review.save).toHaveBeenCalled();
        expect(viewModel.attr('review.status')).toEqual('Unreviewed');
        done();
      });
      saveDfd.resolve(review);
    });

    it('should change modal window state to false', (done) => {
      viewModel.attr('review.access_control_list', newACL);

      expect(viewModel.attr('modalState.open')).toBeTruthy();

      viewModel.save();

      saveDfd.then(() => {
        expect(viewModel.attr('modalState.open')).toBeFalsy();
        done();
      });
      saveDfd.resolve(review);
    });

    it('should change loading value to false', (done) => {
      viewModel.attr('review.access_control_list', newACL);

      viewModel.save();
      expect(viewModel.attr('loading')).toBeTruthy();

      saveDfd.then(() => {
        expect(viewModel.attr('loading')).toBeFalsy();
        done();
      });
      saveDfd.resolve(review);
    });
  });

  describe('cancel() method', () => {
    const originalEmailComment = 'email comment...';
    const originalACL = [{person_id: 1}];
    let review;

    beforeEach(() => {
      review = new Review({
        access_control_list: originalACL,
        email_message: originalEmailComment,
      });

      review.backup();
      viewModel.attr('review', review);
    });

    it('should change modal open state to false', () => {
      viewModel.cancel();

      expect(viewModel.attr('modalState.open')).toBeFalsy();
    });

    it('should restore Review model', () => {
      spyOn(review, 'restore').and.callThrough();

      review.attr({
        email_message: 'NEW EMAIL MESSAGE!',
        access_control_list: [{person_id: 2}],
      });
      viewModel.cancel();

      expect(review.restore).toHaveBeenCalledWith(true);
      expect(viewModel.attr('review.email_message'))
        .toEqual(originalEmailComment);
      expect(viewModel.attr('review.access_control_list').serialize())
        .toEqual(originalACL);
    });
  });
});

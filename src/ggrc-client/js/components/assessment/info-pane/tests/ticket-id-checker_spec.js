/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../ticket-id-checker';
import Cacheable from '../../../../models/cacheable';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../../js_specs/spec-helpers';

describe('ticket-id-checker component', () => {
  let viewModel;
  let instance;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    instance = makeFakeInstance({model: Cacheable})({issue_tracker: {}});
    viewModel.attr('instance', instance);
  });

  describe('checkTicketId() method', () => {
    let issueCreatedSpy;

    beforeEach(() => {
      issueCreatedSpy = jasmine.createSpy();
      instance.issueCreated = issueCreatedSpy;

      spyOn(viewModel, 'showModal');
      spyOn(viewModel, 'toggleIssueTracker');
    });

    it('should open modal if user switches on ticket tracker and issue has ' +
    'not been created earlier', () => {
      issueCreatedSpy.and.returnValue(false);
      viewModel.checkTicketId({value: 'true'});

      expect(viewModel.showModal).toHaveBeenCalled();
    });

    it('should set issueTrackerEnabled to true if uset switches on ticket ' +
    'tracker and issue has not been created earlier', () => {
      viewModel.attr('issueTrackerEnabled', false);
      issueCreatedSpy.and.returnValue(false);
      viewModel.checkTicketId({value: 'true'});

      expect(viewModel.attr('issueTrackerEnabled')).toBe(true);
    });

    it('should not open modal if user switches off ticket tracker', () => {
      issueCreatedSpy.and.returnValue(false);
      viewModel.checkTicketId({value: 'false'});

      expect(viewModel.showModal).not.toHaveBeenCalled();
    });

    it('should toggle ticket tracker if user switches off ticket tracker',
      () => {
        issueCreatedSpy.and.returnValue(false);
        viewModel.checkTicketId({value: 'false'});

        expect(viewModel.toggleIssueTracker).toHaveBeenCalledWith('false');
      });

    it('should not open modal if issue already exists', () => {
      issueCreatedSpy.and.returnValue(true);
      viewModel.checkTicketId({value: 'true'});

      expect(viewModel.showModal).not.toHaveBeenCalled();
    });

    it('should toggle ticket tracker if issue already exists', () => {
      issueCreatedSpy.and.returnValue(true);
      viewModel.checkTicketId({value: 'true'});

      expect(viewModel.toggleIssueTracker).toHaveBeenCalledWith('true');
    });
  });

  describe('toggleIssueTracker() method', () => {
    it('should dispatch "valueChange" event', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.toggleIssueTracker(true);

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'valueChange',
        value: true,
        propName: 'issue_tracker.enabled',
      });
    });
  });

  describe('showModal() method', () => {
    it('should set madel state to opened', () => {
      viewModel.attr('modalState.open', false);

      viewModel.showModal();

      expect(viewModel.attr('modalState.open')).toBe(true);
    });
  });

  describe('hideModal() method', () => {
    it('should set modal state to closed', () => {
      viewModel.attr('modalState.open', true);

      viewModel.hideModal();

      expect(viewModel.attr('modalState.open')).toBe(false);
    });

    it('should reset ticket and validation props', () => {
      viewModel.attr('ticketId', 'some ticket id');
      viewModel.attr('isValid', false);

      viewModel.hideModal();

      expect(viewModel.attr('ticketId')).toBe(null);
      expect(viewModel.attr('isValid')).toBe(true);
    });
  });

  describe('cancel() method', () => {
    it('should hide modal', () => {
      spyOn(viewModel, 'hideModal');

      viewModel.cancel();

      expect(viewModel.hideModal).toHaveBeenCalled();
    });

    it('should set issueTrackerEnabled false', () => {
      viewModel.attr('issueTrackerEnabled', true);

      viewModel.cancel();

      expect(viewModel.attr('issueTrackerEnabled')).toBe(false);
    });
  });

  describe('generateNewTicket() method', () => {
    it('should turn on the ticket tracker', () => {
      spyOn(viewModel, 'toggleIssueTracker');

      viewModel.generateNewTicket();

      expect(viewModel.toggleIssueTracker).toHaveBeenCalledWith(true);
    });

    it('should hide modal', () => {
      spyOn(viewModel, 'hideModal');

      viewModel.generateNewTicket();

      expect(viewModel.hideModal).toHaveBeenCalled();
    });
  });

  describe('linkWithExistingTicket() method', () => {
    it('should validate ticket id', () => {
      spyOn(viewModel, 'validateTicketId');

      viewModel.linkWithExistingTicket();

      expect(viewModel.validateTicketId).toHaveBeenCalled();
    });

    it('should not hide modal if ticket id is not valid', () => {
      spyOn(viewModel, 'hideModal');
      spyOn(viewModel, 'validateTicketId').and.returnValue(false);

      viewModel.linkWithExistingTicket();

      expect(viewModel.hideModal).not.toHaveBeenCalled();
    });

    it('should set ticket id to issue tracker if valid', () => {
      spyOn(viewModel, 'validateTicketId').and.returnValue(true);
      viewModel.attr('ticketId', 'some ticket id');

      viewModel.linkWithExistingTicket();

      expect(viewModel.attr('instance.issue_tracker.issue_id'))
        .toBe('some ticket id');
    });

    it('should turn on ticket tracker if ticket id is valid', () => {
      spyOn(viewModel, 'toggleIssueTracker');
      spyOn(viewModel, 'validateTicketId').and.returnValue(true);

      viewModel.linkWithExistingTicket();

      expect(viewModel.toggleIssueTracker).toHaveBeenCalledWith(true);
    });

    it('should hide modal if ticket id is valid', () => {
      spyOn(viewModel, 'hideModal');
      spyOn(viewModel, 'validateTicketId').and.returnValue(true);

      viewModel.linkWithExistingTicket();

      expect(viewModel.hideModal).toHaveBeenCalled();
    });
  });

  describe('validateTicketId() method', () => {
    it('should return true when ticket id is not empty', () => {
      viewModel.attr('isValid', false);
      viewModel.attr('ticketId', 'not empty ticket id');

      let result = viewModel.validateTicketId();

      expect(result).toBe(true);
      expect(viewModel.attr('isValid')).toBe(true);
    });

    it('should return false when ticket id is empty', () => {
      viewModel.attr('isValid', true);
      viewModel.attr('ticketId', '');

      let result = viewModel.validateTicketId();

      expect(result).toBe(false);
      expect(viewModel.attr('isValid')).toBe(false);
    });
  });
});

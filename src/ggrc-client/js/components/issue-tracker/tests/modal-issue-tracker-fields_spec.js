/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../modal-issue-tracker-fields';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import Cacheable from '../../../models/cacheable';

describe('modal-issue-tracker-fields component', () => {
  let viewModel;
  let state;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.attr('instance', makeFakeInstance({
      model: Cacheable,
      staticProps: {
        unchangeableIssueTrackerIdStatuses: ['Fixed'],
      },
      instanceProps: {
        issue_tracker: {},
        setDefaultHotlistAndComponent: jasmine.createSpy(),
        issueCreated: jasmine.createSpy(),
      }})());
    state = viewModel.attr('state');
  });

  describe('viewModel', () => {
    describe('displayFields prop', () => {
      it('should return FALSE when issue tracker is disabled', () => {
        viewModel.attr('instance.issue_tracker.enabled', false);
        viewModel.attr('currentState', state.LINKED);

        expect(viewModel.attr('displayFields')).toBe(false);
      });

      it('should return FALSE when view is in NOT_SELECTED state', () => {
        viewModel.attr('instance.issue_tracker.enabled', true);
        viewModel.attr('currentState', state.NOT_SELECTED);

        expect(viewModel.attr('displayFields')).toBe(false);
      });

      it('should return TRUE when issue tracker is enabled and view is not ' +
      'in NOT_SELECTED state', () => {
        viewModel.attr('instance.issue_tracker.enabled', true);
        viewModel.attr('currentState', state.LINKED);

        expect(viewModel.attr('displayFields')).toBe(true);
      });
    });

    describe('generateNewTicket() method', () => {
      beforeEach(() => {
        spyOn(viewModel, 'setValidationFlags');
      });

      it('should do nothing if view is already in GENERATE_NEW state', () => {
        viewModel.attr('currentState', state.GENERATE_NEW);

        viewModel.generateNewTicket();

        expect(viewModel.attr('currentState')).toBe(state.GENERATE_NEW);
        expect(viewModel.setValidationFlags).not.toHaveBeenCalled();
        expect(viewModel.attr('instance').setDefaultHotlistAndComponent)
          .not.toHaveBeenCalled();
      });

      it('should set current view state GENERATE_NEW', () => {
        viewModel.attr('currentState', state.LINK_TO_EXISTING);

        viewModel.generateNewTicket();

        expect(viewModel.attr('currentState')).toBe(state.GENERATE_NEW);
      });

      it('should set validation flags', () => {
        viewModel.attr('currentState', state.LINK_TO_EXISTING);

        viewModel.generateNewTicket();

        expect(viewModel.setValidationFlags).toHaveBeenCalledWith({
          linking: false, initialized: true,
        });
      });

      it('should set default hotlist and component ids', () => {
        viewModel.attr('currentState', state.LINK_TO_EXISTING);

        viewModel.generateNewTicket();

        expect(viewModel.attr('instance').setDefaultHotlistAndComponent)
          .toHaveBeenCalled();
      });

      it('should clean up issue id', () => {
        viewModel.attr('instance.issue_tracker.issue_id', 'issue id');
        viewModel.attr('currentState', state.LINK_TO_EXISTING);

        viewModel.generateNewTicket();

        expect(viewModel.attr('instance.issue_tracker.issue_id')).toBeNull();
      });

      it('should dispatch "issueTrackerStateChanged" event', () => {
        spyOn(viewModel, 'dispatch');
        viewModel.generateNewTicket();

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'issueTrackerStateChanged',
          state: 'generateNew',
        });
      });
    });

    describe('linkToExistingTicket() method', () => {
      beforeEach(() => {
        spyOn(viewModel, 'setValidationFlags');
      });

      it('should do nothing if view is already in LINK_TO_EXISTING state',
        () => {
          viewModel.attr('currentState', state.LINK_TO_EXISTING);

          viewModel.linkToExistingTicket();

          expect(viewModel.attr('currentState')).toBe(state.LINK_TO_EXISTING);
          expect(viewModel.setValidationFlags).not.toHaveBeenCalled();
        });

      it('should set current view state LINK_TO_EXISTING', () => {
        viewModel.attr('currentState', state.GENERATE_NEW);

        viewModel.linkToExistingTicket();

        expect(viewModel.attr('currentState')).toBe(state.LINK_TO_EXISTING);
      });

      it('should set validation flags', () => {
        viewModel.attr('currentState', state.GENERATE_NEW);

        viewModel.linkToExistingTicket();

        expect(viewModel.setValidationFlags).toHaveBeenCalledWith({
          linking: true, initialized: true,
        });
      });

      it('should clean up hotlist and component ids', () => {
        viewModel.attr('instance.issue_tracker.hotlist_id', 'hotlist id');
        viewModel.attr('instance.issue_tracker.component_id', 'component id');
        viewModel.attr('currentState', state.GENERATE_NEW);

        viewModel.linkToExistingTicket();

        expect(viewModel.attr('instance.issue_tracker.hotlist_id')).toBeNull();
        expect(viewModel.attr('instance.issue_tracker.component_id'))
          .toBeNull();
      });

      it('should dispatch "issueTrackerStateChanged" event', () => {
        spyOn(viewModel, 'dispatch');
        viewModel.linkToExistingTicket();

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'issueTrackerStateChanged',
          state: 'linkToExisting',
        });
      });
    });

    describe('setTicketIdMandatory() method', () => {
      it('should set isTicketIdMandatory FALSE if status is not in the list',
        () => {
          viewModel.attr('isTicketIdMandatory', null);
          viewModel.attr('instance.status', 'Status');

          viewModel.setTicketIdMandatory();

          expect(viewModel.attr('isTicketIdMandatory')).toBe(false);
        });

      it('should set isTicketIdMandatory TRUE if status is in the list',
        () => {
          viewModel.attr('isTicketIdMandatory', null);
          viewModel.attr('instance.status', 'Fixed');

          viewModel.setTicketIdMandatory();

          expect(viewModel.attr('isTicketIdMandatory')).toBe(true);
        });
    });
  });

  describe('events', () => {
    let events;
    let handler;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('inserted event', () => {
      beforeEach(() => {
        handler = events.inserted.bind({viewModel});
        spyOn(viewModel, 'setTicketIdMandatory');
        spyOn(viewModel, 'setValidationFlags');
      });

      it('should call setTicketIdMandatory', () => {
        handler();

        expect(viewModel.setTicketIdMandatory).toHaveBeenCalled();
      });

      it('should set LINKED view state if issue is already created', () => {
        viewModel.attr('currentState', state.NOT_SELECTED);
        viewModel.attr('instance').issueCreated.and.returnValue(true);

        handler();

        expect(viewModel.attr('currentState')).toBe(state.LINKED);
        expect(viewModel.setValidationFlags).toHaveBeenCalledWith({
          initialized: true, linking: false,
        });
      });

      it('should set validation flags if issue is not exist', () => {
        handler();

        expect(viewModel.setValidationFlags).toHaveBeenCalledWith({
          initialized: false, linking: false,
        });
      });
    });

    describe('{viewModel.instance} status', () => {
      beforeEach(() => {
        handler = events['{viewModel.instance} status'].bind({viewModel});
        spyOn(viewModel, 'setTicketIdMandatory');
      });

      it('should call setTicketIdMandatory' +
      'and it is not initialized', () => {
        handler();

        expect(viewModel.setTicketIdMandatory).toHaveBeenCalled();
      });
    });
  });
});

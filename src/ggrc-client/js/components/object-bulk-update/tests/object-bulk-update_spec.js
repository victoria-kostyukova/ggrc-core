/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import makeArray from 'can-util/js/make-array/make-array';
import canMap from 'can-map';
import canDefineList from 'can-define/list/list';
import Component from '../object-bulk-update';
import * as stateUtils from '../../../plugins/utils/state-utils';
import tracker from '../../../tracker';

describe('object-bulk-update component', () => {
  let events;

  beforeAll(() => {
    events = Component.prototype.events;
  });

  describe('viewModel() method', () => {
    let parentViewModel;
    let method;
    let targetStates;
    let result;

    beforeEach(() => {
      parentViewModel = new canMap();
      method = Component.prototype.viewModel;
      targetStates = ['Assigned', 'In Progress'];

      spyOn(stateUtils, 'getBulkStatesForModel')
        .and.returnValue(targetStates);

      result = method({type: 'some type'}, parentViewModel)();
    });

    it('returns correct type', () => {
      expect(result.type).toEqual('some type');
    });

    it('returns correct target states', () => {
      let actual = makeArray(result.targetStates);
      expect(actual).toEqual(targetStates);
    });

    it('returns correct target state', () => {
      expect(result.targetState).toEqual('Assigned');
    });

    it('returns set reduceToOwnedItems flag', () => {
      expect(result.reduceToOwnedItems).toBeTruthy();
    });

    it('returns set showTargetState flag', () => {
      expect(result.showTargetState).toBeTruthy();
    });

    it('returns correct defaultSort', () => {
      expect(result.defaultSort.serialize()[0].key).toEqual('task due date');
    });
  });

  describe('methods of extended viewModel', () => {
    let viewModel;

    beforeEach(() => {
      spyOn(stateUtils, 'getBulkStatesForModel')
        .and.returnValue([]);
      const ViewModel = Component.prototype.viewModel({}, new canMap());
      ViewModel.seal = false;
      viewModel = new ViewModel();
    });

    describe('closeModal() method', () => {
      it('closes modal if element defined', () => {
        const fakeCloseBtn = {
          trigger: jasmine.createSpy(),
        };

        viewModel.element = {
          find: () => fakeCloseBtn,
        };

        viewModel.closeModal();

        expect(fakeCloseBtn.trigger).toHaveBeenCalledWith('click');
      });
    });

    describe('performUpdate() method', () => {
      beforeEach(() => {
        spyOn(tracker, 'start')
          .and.returnValue(() => {});
        viewModel.callback = jasmine.createSpy()
          .and.returnValue(Promise.resolve());
      });

      it('calls callback() method', async () => {
        viewModel.selected = ['selected'];
        viewModel.targetState = ['fake_state'];

        await viewModel.performUpdate();

        expect(viewModel.callback).toHaveBeenCalledWith(
          jasmine.anything(), {
            selected: new canDefineList(['selected']),
            options: {
              state: new canDefineList(['fake_state']),
            },
          },
        );
      });
    });
  });

  describe('"inserted" event handler', () => {
    let event;
    let context;

    beforeEach(() => {
      context = {
        viewModel: new canMap({
          onSubmit: jasmine.createSpy(),
        }),
      };
      event = events.inserted.bind(context);
    });

    it('calls onSubmit()', () => {
      event();

      expect(context.viewModel.onSubmit).toHaveBeenCalled();
    });
  });
});

/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapped-counter';
import {REFRESH_MAPPED_COUNTER} from '../../../events/event-types';

describe('mapped-counter component', () => {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('updateCounter() method', () => {
    it('dispatches updateCounter event with the callback', () => {
      spyOn(viewModel, 'dispatch');
      viewModel.updateCounter();
      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'updateCounter',
        callback: jasmine.any(Function),
      });
    });

    it('sets "lockUntilUpdate" field to true before update',
      () => {
        viewModel.lockUntilUpdate = false;
        viewModel.updateCounter();
        expect(viewModel.lockUntilUpdate).toBe(true);
      });

    describe('dispatches event with callback which', () => {
      let callback;
      beforeEach(() => {
        spyOn(viewModel, 'dispatch');
        viewModel.updateCounter();
        callback = viewModel.dispatch.calls.argsFor(0)[0]
          .callback;
      });

      it('calls load() method', () => {
        spyOn(viewModel, 'load').and.returnValue(Promise.resolve());

        callback();

        expect(viewModel.load).toHaveBeenCalled();
      });

      it('sets "lockUntilUpdate" field to false after load() method success',
        async () => {
          spyOn(viewModel, 'load').and.returnValue(Promise.resolve());
          viewModel.lockUntilUpdate = true;

          await callback();

          expect(viewModel.lockUntilUpdate).toBe(false);
        });

      it('sets "lockUntilUpdate" field to false if load() method was failed',
        async () => {
          spyOn(viewModel, 'load').and.returnValue(Promise.reject());
          viewModel.lockUntilUpdate = true;

          await expectAsync(callback()).toBeRejected();

          expect(viewModel.lockUntilUpdate).toBe(false);
        });
    });
  });

  describe('events section', () => {
    let events;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('"{viewModel.instance} ${REFRESH_MAPPED_COUNTER.type}" handler',
      () => {
        let handler;

        beforeEach(() => {
          handler = events[
            `{viewModel.instance} ${REFRESH_MAPPED_COUNTER.type}`
          ].bind({viewModel});
          spyOn(viewModel, 'updateCounter');
        });

        it('calls updateCounter() method when viewModel\'s type ' +
        'equals to passed type of the model', () => {
          const type = 'SomeType';

          viewModel.type = type;
          handler([{}], {modelType: type});

          expect(viewModel.updateCounter).toHaveBeenCalled();
        });

        it('doesn\'t call updateCounter() method when viewModel\'s ' +
        'type doesn\'t equal to passed type of the model', () => {
          viewModel.type = 'Type1';
          handler([{}], {modelType: 'Type2'});

          expect(viewModel.updateCounter).not.toHaveBeenCalled();
        });
      });
  });
});

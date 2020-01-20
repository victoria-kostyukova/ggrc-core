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

  describe('deferredUpdateCounter() method', () => {
    it('dispatches deferredUpdateCounter event with the callback', () => {
      spyOn(viewModel, 'dispatch');
      viewModel.deferredUpdateCounter();
      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'deferredUpdateCounter',
        deferredCallback: jasmine.any(Function),
      });
    });

    it('sets "lockUntilDeferredUpdate" field to true before deferred update',
      () => {
        viewModel.attr('lockUntilDeferredUpdate', false);
        viewModel.deferredUpdateCounter();
        expect(viewModel.attr('lockUntilDeferredUpdate')).toBe(true);
      });

    describe('dispatches event with deferred callback which', () => {
      let deferredCallback;
      let loadDfd;

      beforeEach(() => {
        spyOn(viewModel, 'dispatch');
        viewModel.deferredUpdateCounter();
        deferredCallback = viewModel.dispatch.calls.argsFor(0)[0]
          .deferredCallback;
        loadDfd = new $.Deferred();
        spyOn(viewModel, 'load').and.returnValue(loadDfd);
      });

      it('calls load() method', () => {
        deferredCallback();
        expect(viewModel.load).toHaveBeenCalled();
      });

      describe('always after "load" operation', () => {
        beforeEach(() => {
          loadDfd.resolve();
        });

        it('sets "lockUntilDeferredUpdate" field to false',
          () => {
            viewModel.attr('lockUntilDeferredUpdate', true);
            deferredCallback();
            expect(viewModel.attr('lockUntilDeferredUpdate')).toBe(false);
          });
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
          spyOn(viewModel, 'deferredUpdateCounter');
        });

        it('calls deferredUpdateCounter() method when viewModel\'s type ' +
        'equals to passed type of the model', () => {
          const type = 'SomeType';

          viewModel.attr('type', type);
          handler([{}], {modelType: type});

          expect(viewModel.deferredUpdateCounter).toHaveBeenCalled();
        });

        it('doesn\'t call deferredUpdateCounter() method when viewModel\'s ' +
        'type doesn\'t equal to passed type of the model', () => {
          viewModel.attr('type', 'Type1');
          handler([{}], {modelType: 'Type2'});

          expect(viewModel.deferredUpdateCounter).not.toHaveBeenCalled();
        });
      });
  });
});

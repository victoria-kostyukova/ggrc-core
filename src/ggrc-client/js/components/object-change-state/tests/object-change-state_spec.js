/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../object-change-state';

describe('object-change-state component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel scope', function () {
    describe('changeState() method', function () {
      it('dipatches onStateChange event with passed status', function () {
        let newState = 'newState';

        spyOn(viewModel, 'dispatch');
        viewModel.changeState(newState);

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'onStateChange',
          state: newState,
        });
      });
    });
  });

  describe('event scope', function () {
    let events;

    beforeEach(function () {
      events = Component.prototype.events;
    });

    describe('click handler', function () {
      let handler;
      let fakeEvent;

      beforeEach(function () {
        let eventScope = {
          viewModel: viewModel,
        };
        fakeEvent = new Event('click');
        handler = events.click.bind(eventScope);
      });

      it('changes state to viewModel.toState value with help a viewModel ' +
      'changeState method', function () {
        let toState = 'toState';
        spyOn(viewModel, 'changeState');
        viewModel.attr('toState', toState);
        handler({}, fakeEvent);
        expect(viewModel.changeState).toHaveBeenCalledWith(toState);
      });

      it('prevents default behavior for passed event', function () {
        spyOn(fakeEvent, 'preventDefault');
        handler({}, fakeEvent);
        expect(fakeEvent.preventDefault).toHaveBeenCalled();
      });
    });
  });
});

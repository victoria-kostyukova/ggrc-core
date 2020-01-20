/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../object-state-toolbar';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import {SWITCH_TO_ERROR_PANEL, SHOW_INVALID_FIELD} from '../../../events/event-types';

describe('object-state-toolbar component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.attr('instance', {});
  });

  describe('changeState() method', () => {
    const newState = 'In Progress';

    describe('dispatches onStateChange with new state', () => {
      beforeEach(() => {
        viewModel.dispatch = jasmine.createSpy();
      });

      it('without validation errors and when isUndo is false', () => {
        viewModel.attr('instance._hasValidationErrors', false);
        const isUndo = false;
        viewModel.changeState(newState, isUndo);

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'onStateChange',
          state: newState,
          undo: isUndo,
        });
      });

      it('without validation errors and when isUndo is true', () => {
        viewModel.attr('instance._hasValidationErrors', false);
        const isUndo = true;
        viewModel.changeState(newState, isUndo);

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'onStateChange',
          state: newState,
          undo: isUndo,
        });
      });

      it('with validation errors and when isUndo is true', () => {
        viewModel.attr('instance._hasValidationErrors', true);
        const isUndo = true;
        viewModel.changeState(newState, isUndo);

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'onStateChange',
          state: newState,
          undo: isUndo,
        });
      });
    });

    describe('does not dispatch onStateChange', () => {
      beforeEach(() => {
        viewModel.attr('instance').dispatch = jasmine.createSpy();
        viewModel.dispatch = jasmine.createSpy();
      });

      it('with validation errors and when isUndo is false', () => {
        viewModel.attr('instance._hasValidationErrors', true);
        const isUndo = false;
        viewModel.changeState(newState, isUndo);

        expect(viewModel.dispatch).not.toHaveBeenCalled();
        expect(viewModel.attr('instance').dispatch)
          .toHaveBeenCalledWith(SWITCH_TO_ERROR_PANEL);
        expect(viewModel.attr('instance').dispatch)
          .toHaveBeenCalledWith(SHOW_INVALID_FIELD);
      });
    });
  });
});

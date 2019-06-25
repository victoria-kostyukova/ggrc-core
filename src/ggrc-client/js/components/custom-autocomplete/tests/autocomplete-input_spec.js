/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component, {KEY_MAP} from '../autocomplete-input';

describe('autocomplete-input component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('showResults set() method', () => {
    it('should set "value" to empty string when there is no showResults value',
      () => {
        [false, undefined, null, ''].forEach((val) => {
          viewModel.attr('value', 'abcd');
          viewModel.attr('showResults', val);
          const result = viewModel.attr('value');

          expect(result).toBe('');
        });
      });

    it('should set "showResults" to new value', () => {
      const newValue = 'abcd';
      viewModel.attr('showResults', newValue);
      const result = viewModel.attr('showResults');

      expect(newValue).toEqual(result);
    });
  });

  describe('makeServiceAction() method', () => {
    it('should call "escape" method if keyCode matches to ESCAPE key', () => {
      spyOn(viewModel, 'escape');
      viewModel.makeServiceAction(KEY_MAP.ESCAPE);

      expect(viewModel.escape).toHaveBeenCalled();
    });

    it('should not call "escape" method when keyCode is not ESCAPE key', () => {
      spyOn(viewModel, 'escape');
      viewModel.makeServiceAction(KEY_MAP.ENTER);

      expect(viewModel.escape).not.toHaveBeenCalled();
    });
  });

  describe('escape() method', () => {
    it('should set "showResults" to false', () => {
      viewModel.attr('showResults', true);
      viewModel.escape();

      const showResults = viewModel.attr('showResults');
      expect(showResults).toBe(false);
    });
  });

  describe('inputLatency() method', () => {
    const msTime = 501;

    it('should set "isPending" to true before dispatching event', () => {
      const value = 'f';
      viewModel.attr('value', value);
      viewModel.attr('isPending', false);

      spyOn(viewModel, 'dispatch');
      spyOn(window, 'setTimeout');

      viewModel.inputLatency();

      expect(viewModel.attr('isPending')).toBe(true);
    });

    it('should notify that value is changed when value is not empty', () => {
      jasmine.clock().install();

      const value = 'f';
      viewModel.attr('value', value);
      spyOn(viewModel, 'dispatch');

      viewModel.inputLatency();

      jasmine.clock().tick(msTime);

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'inputChanged',
        value,
      });

      jasmine.clock().uninstall();
    });

    it('should not notify that value is changed when value is empty', () => {
      jasmine.clock().install();

      const value = '';
      viewModel.attr('value', value);
      spyOn(viewModel, 'dispatch');

      viewModel.inputLatency();

      jasmine.clock().tick(msTime);

      expect(viewModel.dispatch).not.toHaveBeenCalled();

      jasmine.clock().uninstall();
    });

    it('should set "isPending" to false after delay', () => {
      jasmine.clock().install();

      ['any value', null, '', undefined].forEach((value) => {
        viewModel.attr('value', value);
        viewModel.attr('isPending', true);

        viewModel.inputLatency();
        jasmine.clock().tick(msTime);

        expect(viewModel.attr('isPending')).toBe(false);
      });

      jasmine.clock().uninstall();
    });
  });

  describe('"input.autocomplete-input keyup" handler', () => {
    let handler;
    let element;
    let event;
    const fakeData = {
      name: 'f',
      keyCode: 70,
    };

    beforeEach(() => {
      let events = Component.prototype.events;
      handler = events['input.autocomplete-input keyup'].bind({viewModel});
      element = $('<input>').val(fakeData.name);
      event = {
        keyCode: fakeData.keyCode,
      };
    });

    it('should set "value" attr and remove space characters', () => {
      viewModel.attr('isPending', true);
      element.val(`     ${fakeData.name}    `);

      handler(element, event);

      expect(viewModel.attr('value')).toEqual(fakeData.name);
    });

    it('should call "inputLatency" method when isPending is FALSE', () => {
      viewModel.attr('isPending', false);
      spyOn(viewModel, 'inputLatency');

      handler(element, event);

      expect(viewModel.inputLatency).toHaveBeenCalled();
    });

    it('should make service action when key code in "KEY_MAP"' +
    ' and isPending is FALSE', () => {
      viewModel.attr('isPending', false);
      spyOn(viewModel, 'makeServiceAction');

      loForEach(KEY_MAP, (value) => {
        event.keyCode = value;
        handler(element, event);
        expect(viewModel.makeServiceAction)
          .toHaveBeenCalledWith(event.keyCode);
      });
    });

    it('should not call "inputLatency" method when key code in "KEY_MAP"' +
    ' and isPending is FALSE', () => {
      viewModel.attr('isPending', false);
      spyOn(viewModel, 'inputLatency');

      loForEach(KEY_MAP, (value) => {
        event.keyCode = value;
        handler(element, event);
        expect(viewModel.inputLatency).not.toHaveBeenCalled();
      });
    });
  });
});

/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../rich-text-form-field';

describe('rich-text-form-field', () => {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    spyOn(viewModel, 'dispatch');
    viewModel.fieldId = 'id';
  });

  it('does not fire valueChanged event on first value assignation', () => {
    viewModel.value = '';
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('sets the value of the input', () => {
    viewModel.value = 'test';
    expect(viewModel.inputValue).toEqual('test');
  });

  describe('updateRichTextValue() method', () => {
    it('fires valueChanged event', () => {
      viewModel.updateRichTextValue({newValue: 'newValue'});
      viewModel.onBlur();
      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'valueChanged',
        fieldId: 'id',
        value: 'newValue',
      });
      viewModel.updateRichTextValue({newValue: 'newValue2'});
      viewModel.onBlur();
      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'valueChanged',
        fieldId: 'id',
        value: 'newValue2',
      });
    });
  });

  describe('isAllowToSet() method', () => {
    it('should return TRUE. has focus and values are equal', () => {
      let value = 'myText';
      viewModel._value = value;
      viewModel._oldValue = value;
      viewModel.editorHasFocus = true;

      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeTruthy();
    });

    it('should return TRUE. doesn\'t have focus and values are equal', () => {
      let value = 'myText';
      viewModel._value = value;
      viewModel._oldValue = value;
      viewModel.editorHasFocus = false;

      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeTruthy();
    });

    it('should return TRUE. doesn\'t have focus and values NOT are equal',
      () => {
        let value = 'myText';
        viewModel._value = value;
        viewModel._oldValue = 'myTex';
        viewModel.editorHasFocus = false;

        let isAllow = viewModel.isAllowToSet();

        expect(isAllow).toBeTruthy();
      }
    );

    it('should return FALSE. has focus and values are NOT equal', () => {
      let value = 'myText';
      viewModel._value = value;
      viewModel._oldValue = 'myTex';
      viewModel.editorHasFocus = true;

      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeFalsy();
    });
  });
});

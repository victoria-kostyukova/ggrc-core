/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../text-form-field';

describe('text-form-field component', () => {
  let viewModel;

  beforeEach(() => {
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

  it('does not fire valueChanged event if value wasn\'t changed', () => {
    viewModel.value = '';
    viewModel.inputValue = 'newValue';
    viewModel.dispatch.calls.reset();
    viewModel.inputValue = 'newValue';
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('fires valueChanged event on input value change', () => {
    viewModel.value = '';
    viewModel.inputValue = 'newValue';
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 'id',
      value: 'newValue',
    });
    viewModel.inputValue = 'newValue2';
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 'id',
      value: 'newValue2',
    });
  });

  describe('isAllowToSet() method', () => {
    let textField;

    beforeEach(() => {
      textField = $('<input type="text" value="myText"/>');
      viewModel.textField = textField;
    });

    it('should return TRUE. has focus and values are equal', () => {
      let value = 'myText';
      viewModel._value = value;
      textField.val(value);

      spyOn(textField, 'is').and.returnValue(true);
      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeTruthy();
    });

    it('should return TRUE. doesn\'t have focus and values are equal', () => {
      let value = 'myText';
      viewModel._value = value;
      textField.val(value);

      spyOn(textField, 'is').and.returnValue(false);
      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeTruthy();
    });

    it('should return TRUE. doesn\'t have focus and values NOT are equal',
      () => {
        let value = 'myText';
        viewModel._value = value;
        textField.val('new value');

        spyOn(textField, 'is').and.returnValue(false);
        let isAllow = viewModel.isAllowToSet();

        expect(isAllow).toBeTruthy();
      }
    );

    it('should return FALSE. has focus and values are NOT equal', () => {
      let value = 'myText';
      viewModel._value = value;
      textField.val('new val');

      spyOn(textField, 'is').and.returnValue(true);
      let isAllow = viewModel.isAllowToSet();

      expect(isAllow).toBeFalsy();
    });
  });
});

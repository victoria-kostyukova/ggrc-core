/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../dropdown-form-field';

describe('dropdown-form-field component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    spyOn(viewModel, 'dispatch');
    viewModel.fieldId = 1;
  });

  it('does not fire valueChanged event on' +
    ' first value assignation', () => {
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
      fieldId: 1,
      value: 'newValue',
    });
    viewModel.inputValue = 'newValue2';
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 1,
      value: 'newValue2',
    });
  });
});

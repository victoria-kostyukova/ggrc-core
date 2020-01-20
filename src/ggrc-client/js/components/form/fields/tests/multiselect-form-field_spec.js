/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../multiselect-form-field';

describe('multiselect-form-field component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    spyOn(viewModel, 'dispatch');
    viewModel.attr('fieldId', 'id');
  });

  it('does not fire valueChanged event on first value assignation', () => {
    const newValue = new canMap({
      selected: [{value: 'option1', checked: true}],
    });
    viewModel.attr('value', newValue);
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('sets the value of the input', () => {
    const newValue = new canMap({
      selected: [{value: 'option2', checked: true}],
    });

    viewModel.attr('value', newValue);
    expect(viewModel.attr('inputValue')).toEqual(newValue);
  });

  it('fires valueChanged event on input value change', () => {
    const newValue = new canMap({
      selected: [
        {value: 'option1', checked: true},
        {value: 'option2', checked: true},
      ]});
    viewModel.attr('inputValue', newValue);
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 'id',
      value: 'option1,option2',
    });
  });
});

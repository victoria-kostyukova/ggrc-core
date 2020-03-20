/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../dropdown-wrap-text';

describe('dropdown-wrap-text component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.isDisabled = false;
  });

  describe('build of options', () => {
    let optionsList = [
      {title: 'title 1', value: 'value1'},
      {title: 'title 2', value: 'value2'},
      {title: 'title 3', value: 'value3'},
    ];

    beforeEach(() => {
      viewModel.noValue = false;
    });

    it('should build list from optionsList', () => {
      viewModel.optionsList = optionsList;
      let list = viewModel.options;

      expect(list.length).toEqual(3);
      expect(list[0].title).toEqual(optionsList[0].title);
      expect(list[2].title).toEqual(optionsList[2].title);
    });

    it('should build list from optionsList with default None value', () => {
      viewModel.optionsList = optionsList;
      viewModel.noValue = true;
      viewModel.noValueLabel = '';
      let list = viewModel.options;

      expect(list.length).toEqual(4);
      expect(list[0].title).toEqual('--');
      expect(list[3].title).toEqual(optionsList[2].title);
    });

    it('should build list from optionsList with custom None value', () => {
      let customNoneValue = 'empty value';

      viewModel.optionsList = optionsList;
      viewModel.noValue = true;
      viewModel.noValueLabel = customNoneValue;
      let list = viewModel.options;

      expect(list.length).toEqual(4);
      expect(list[0].title).toEqual(customNoneValue);
      expect(list[3].title).toEqual(optionsList[2].title);
    });
  });

  describe('onInputClick method', () => {
    it('should NOT change "isOpen" attr, because component is disabled', () => {
      viewModel.isDisabled = true;
      viewModel.isOpen = false;

      viewModel.onInputClick();
      expect(viewModel.isOpen).toBeFalsy();
    });

    it('should open dropdown', () => {
      viewModel.isOpen = false;

      viewModel.onInputClick();
      expect(viewModel.isOpen).toBeTruthy();
    });

    it('should close dropdown', () => {
      viewModel.isOpen = true;

      viewModel.onInputClick();
      expect(viewModel.isOpen).toBeFalsy();
    });
  });

  describe('setSelectedByValue method', () => {
    it('should NOT change "selected" attr. Options list is empty', () => {
      viewModel.optionsList = [];
      viewModel.selected = -1;

      viewModel.setSelectedByValue('value #1');
      expect(viewModel.selected).toBe(-1);
    });

    it('should select first item from options list', () => {
      viewModel.optionsList = [
        {
          value: 'value #1',
        }, {
          value: 'value #2',
        },
      ];

      viewModel.selected = undefined;

      viewModel.setSelectedByValue('value #3');
      expect(viewModel.selected.value).toEqual('value #1');
    });

    it('should select correct value, because options list has it', () => {
      const expectedValue = 'value #2';
      viewModel.optionsList = [
        {
          value: 'value #1',
        }, {
          value: expectedValue,
        },
      ];

      viewModel.selected = undefined;

      viewModel.setSelectedByValue(expectedValue);
      expect(viewModel.selected.value).toEqual(expectedValue);
    });
  });
});

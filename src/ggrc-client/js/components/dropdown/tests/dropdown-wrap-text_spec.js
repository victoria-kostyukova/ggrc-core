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
    viewModel.attr('isDisabled', false);
  });

  describe('build of options', () => {
    let optionsList = [
      {title: 'title 1', value: 'value1'},
      {title: 'title 2', value: 'value2'},
      {title: 'title 3', value: 'value3'},
    ];

    beforeEach(() => {
      viewModel.attr('noValue', false);
    });

    it('should build list from optionsList', () => {
      viewModel.attr('optionsList', optionsList);
      let list = viewModel.attr('options');

      expect(list.length).toEqual(3);
      expect(list[0].title).toEqual(optionsList[0].title);
      expect(list[2].title).toEqual(optionsList[2].title);
    });

    it('should build list from optionsList with default None value', () => {
      viewModel.attr('optionsList', optionsList);
      viewModel.attr('noValue', true);
      viewModel.attr('noValueLabel', '');
      let list = viewModel.attr('options');

      expect(list.length).toEqual(4);
      expect(list[0].title).toEqual('--');
      expect(list[3].title).toEqual(optionsList[2].title);
    });

    it('should build list from optionsList with custom None value', () => {
      let customNoneValue = 'empty value';

      viewModel.attr('optionsList', optionsList);
      viewModel.attr('noValue', true);
      viewModel.attr('noValueLabel', customNoneValue);
      let list = viewModel.attr('options');

      expect(list.length).toEqual(4);
      expect(list[0].title).toEqual(customNoneValue);
      expect(list[3].title).toEqual(optionsList[2].title);
    });
  });

  describe('onInputClick method', () => {
    it('should NOT change "isOpen" attr, because component is disabled', () => {
      viewModel.attr('isDisabled', true);
      viewModel.attr('isOpen', false);

      viewModel.onInputClick();
      expect(viewModel.attr('isOpen')).toBeFalsy();
    });

    it('should open dropdown', () => {
      viewModel.attr('isOpen', false);

      viewModel.onInputClick();
      expect(viewModel.attr('isOpen')).toBeTruthy();
    });

    it('should close dropdown', () => {
      viewModel.attr('isOpen', true);

      viewModel.onInputClick();
      expect(viewModel.attr('isOpen')).toBeFalsy();
    });
  });

  describe('setSelectedByValue method', () => {
    it('should NOT change "selected" attr. Options list is empty', () => {
      viewModel.attr('optionsList', []);
      viewModel.attr('selected', -1);

      viewModel.setSelectedByValue('value #1');
      expect(viewModel.attr('selected')).toBe(-1);
    });

    it('should select first item from options list', () => {
      viewModel.attr('optionsList', [
        {
          value: 'value #1',
        }, {
          value: 'value #2',
        },
      ]);

      viewModel.attr('selected', undefined);

      viewModel.setSelectedByValue('value #3');
      expect(viewModel.attr('selected.value')).toEqual('value #1');
    });

    it('should select correct value, because options list has it', () => {
      const expectedValue = 'value #2';
      viewModel.attr('optionsList', [
        {
          value: 'value #1',
        }, {
          value: expectedValue,
        },
      ]);

      viewModel.attr('selected', undefined);

      viewModel.setSelectedByValue(expectedValue);
      expect(viewModel.attr('selected.value')).toEqual(expectedValue);
    });
  });
});
